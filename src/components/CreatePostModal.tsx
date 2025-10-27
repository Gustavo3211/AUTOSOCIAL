import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/superbase";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserProfileId?: number | null;
}

type Category = {
  id: number;
  title: string;
};

export const CreatePostModal = ({ open, onOpenChange, currentUserProfileId }: CreatePostModalProps) => {
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bucketName = "posts";

  // Buscar categorias do banco
  useEffect(() => {
    if (!open) return;

    async function fetchCategories() {
      const { data, error } = await supabase.from("Category").select("id, title");

      if (error) {
        console.error("Erro ao buscar categorias:", error.message);
      } else if (data) {
        console.log("Categorias carregadas:", data);
        setCategories(data);
      }
    }

    fetchCategories();
  }, [open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Imagem selecionada:", file.name, file.size, file.type);

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("Preview gerado");
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearForm = () => {
    setSelectedCategory("");
    setImageFile(null);
    setImagePreview("");
    setTitle("");
    setDescription("");
    setSpecs("");
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    console.log("Usuário logado:", currentUserProfileId);
    if (!currentUserProfileId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para postar.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCategory || !imageFile || title.length < 5) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha categoria, imagem e título (mínimo 5 caracteres).",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload da imagem direto no bucket público
      const fileExtension = imageFile.name.split(".").pop();
      const filePath = `public/${currentUserProfileId}/post-${Date.now()}.${fileExtension}`;
      console.log("Path do arquivo:", filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageFile, { upsert: true });

      console.log("Resultado do upload:", uploadData, uploadError);
      if (uploadError) throw uploadError;

      // URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        console.log("filePath:", filePath); //logcolocado
        console.log("publicUrlData:", publicUrlData);//logcolocado

      console.log("Dados da URL pública:", publicUrlData);
      const imageUrl = publicUrlData?.publicUrl;
      if (!imageUrl) throw new Error("Erro ao gerar URL pública.");
      console.log("URL pública gerada:", imageUrl);

      // Inserir no banco (tabela 'Posts')
      const { error: insertError } = await supabase.from("Posts").insert([
        {
          user_id: currentUserProfileId,
          carTitle: title,
          carImage: imageUrl,
          carSpecs: specs,
          description,
          category: parseInt(selectedCategory),
          like: 0,
          comments: 0
        }
      ]);

      console.log("Insert no banco:", insertError ? "Erro" : "Sucesso", insertError);
      if (insertError) throw insertError;

      toast({
        title: "Post criado!",
        description: "Seu carro foi compartilhado com sucesso!"
      });

      clearForm();
      onOpenChange(false);
    } catch (err: any) {
      console.log("bucketName:", bucketName); //logcolocado
      
      console.log("currentUserProfileId:", currentUserProfileId); // logcolocado
      

      console.error("Erro ao criar post:", err.message);
      toast({
        title: "Erro ao publicar",
        description: err.message || "Houve um problema ao enviar seu post. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) clearForm();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Categorias */}
          <div>
            <Label>Categoria *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  className={selectedCategory === category.id.toString() ? "bg-primary" : ""}
                >
                  {category.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Upload de Imagem */}
          <div>
            <Label>Foto do Carro *</Label>
            {imagePreview ? (
              <div className="relative mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors mt-2">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Clique para adicionar foto</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="title">Título do Carro *</Label>
            <Input
              id="title"
              placeholder="Ex: Honda Civic Si Tunado"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/50 caracteres
            </p>
          </div>

          {/* Especificações */}
          <div>
            <Label htmlFor="specs">Especificações Técnicas</Label>
            <Input
              id="specs"
              placeholder="Ex: Turbo K20 • 350hp • Suspensão Coilover"
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Conte sobre seu carro, modificações, história..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              className="mt-2 min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/500 caracteres
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedCategory || !imageFile || !title || title.length < 5}
            className="flex-1 bg-gradient-primary"
          >
            {isSubmitting ? (
              "Publicando..."
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Publicar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
