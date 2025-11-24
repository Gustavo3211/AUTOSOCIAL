import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, Rocket, Loader2 } from "lucide-react"; // Adicionado Loader2
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserProfileId?: number | null;
}

type Category = {
  id: number;
  title: string;
};

const fetchCategories = async () => {
  const { data, error } = await supabase.from("Category").select("id, title");
  if (error) throw error;
  return data as Category[];
};

export const CreatePostModal = ({ open, onOpenChange, currentUserProfileId }: CreatePostModalProps) => {
  const { toast } = useToast();
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bucketName = "posts";

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
    setIsSubmitting(true);

    if (!currentUserProfileId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para postar.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    if (!selectedCategory || !imageFile || title.length < 5) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha categoria, imagem e título (mínimo 5 caracteres).",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Upload da imagem
      const fileExtension = imageFile.name.split(".").pop();
      const filePath = `public/${currentUserProfileId}/post-${Date.now()}.${fileExtension}`; 
      console.log("Path do arquivo:", filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageFile, { 
          upsert: true,
          contentType: imageFile.type 
        });

      console.log("Resultado do upload:", uploadData, uploadError);
      if (uploadError) throw uploadError;

      // URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      console.log("filePath:", filePath);
      console.log("publicUrlData:", publicUrlData);

      const imageUrl = publicUrlData?.publicUrl;
      if (!imageUrl) throw new Error("Erro ao gerar URL pública.");
      console.log("URL pública gerada:", imageUrl);

      // Insert no banco
      const { error: insertError } = await supabase
        .from("Posts")
        .insert([
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
      onOpenChange(false); // Fecha o modal

      window.location.reload();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Erro ao criar post:", errorMessage);
      toast({
        title: "Erro ao publicar",
        description: errorMessage || "Houve um problema ao enviar seu post. Tente novamente.",
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
      {/* 1. Modal Content: Fundo escuro e texto claro */}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          {/* 2. Título */}
          <DialogTitle className="text-xl text-white">Criar Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4"> {/* Aumentado space-y para melhor espaçamento */}
          {/* Categorias */}
          <div>
            {/* 3. Label */}
            <Label className="text-white">Categoria *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  // 4. Botões de Categoria: Destacado com o gradiente laranja/vermelho
                  className={
                    selectedCategory === category.id.toString() 
                      ? "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700" 
                      : "bg-gray-800 text-white border-gray-700 hover:bg-gray-700" // Outline para Dark Mode
                  }
                  disabled={isSubmitting}
                >
                  {category.title}
                </Button>
              ))}
              {categoriesLoading && (
                <div className="col-span-2 text-center text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Carregando categorias...
                </div>
              )}
            </div>
          </div>

          {/* Upload de Imagem */}
          <div>
            <Label className="text-white">Foto do Carro *</Label>
            {imagePreview ? (
              <div className="relative mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-700" // Adicionada borda sutil
                />
                <Button
                  // Botão de remover imagem (X) em destaque/destrutivo
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700" 
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label 
                // 5. Área de Dropzone/Upload: Fundo mais escuro e borda pontilhada clara
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors mt-2 border-gray-600 hover:border-orange-500 bg-gray-800"
              >
                <Upload className="h-8 w-8 text-orange-500 mb-2" /> {/* Ícone em cor de destaque */}
                <span className="text-sm text-gray-400">Clique para adicionar foto</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isSubmitting}
                />
              </label>
            )}
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="title" className="text-white">Título do Carro *</Label>
            {/* 6. Input: Fundo escuro e texto branco */}
            <Input
              id="title"
              placeholder="Ex: Honda Civic Si Tunado"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 bg-gray-800 text-white border-gray-700 focus:ring-orange-600"
              maxLength={50}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/50 caracteres
            </p>
          </div>

          {/* Especificações */}
          <div>
            <Label htmlFor="specs" className="text-white">Especificações Técnicas</Label>
            {/* 6. Input: Fundo escuro e texto branco */}
            <Input
              id="specs"
              placeholder="Ex: Turbo K20 • 350hp • Suspensão Coilover"
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              className="mt-2 bg-gray-800 text-white border-gray-700 focus:ring-orange-600"
              disabled={isSubmitting}
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description" className="text-white">Descrição</Label>
            {/* 7. Textarea: Fundo escuro e texto branco */}
            <Textarea
              id="description"
              placeholder="Conte sobre seu carro, modificações, história..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              className="mt-2 min-h-[100px] bg-gray-800 text-white border-gray-700 focus:ring-orange-600"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {description.length}/500 caracteres
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4 border-t border-gray-700"> {/* Separador sutil */}
          {/* Botão Cancelar (Outline para Dark Mode) */}
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex-1 bg-transparent text-white border-gray-700 hover:bg-gray-700"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          {/* Botão Publicar (Principal com Gradiente) */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedCategory || !imageFile || !title || title.length < 5}
            // 8. Botão Publicar: Gradiente Laranja/Vermelho (mesmo do Salvar do perfil)
            className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                Publicando...
              </>
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