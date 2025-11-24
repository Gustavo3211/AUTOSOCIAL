"use client"

import type React from "react"

import { useState, useEffect } from "react"
// Importações de componentes Shadcn/ui
// Certifique-se de que os seus componentes Shadcn/ui (como Dialog, Button, Input)
// estão configurados para o tema escuro (Dark Mode) no seu projeto.
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, Lock } from "lucide-react" // Adicionei 'Lock' para o ícone de cadeado
import { supabase } from "@/supabase"

interface ProfileEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentProfile: {
    id: number
    username: string
    bio?: string
    avatar_url?: string
  }
  onProfileUpdated: () => void
}

export function ProfileEditModal({ open, onOpenChange, currentProfile, onProfileUpdated }: ProfileEditModalProps) {
  const [username, setUsername] = useState(currentProfile.username)
  const [bio, setBio] = useState(currentProfile.bio || "")
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatar_url || "")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // O nome de usuário é imutável, como sugerido pela imagem com o cadeado
  const isUsernameLocked = true 

  const bucketName = "posts"

  useEffect(() => {
    setUsername(currentProfile.username)
    setBio(currentProfile.bio || "")
    setAvatarUrl(currentProfile.avatar_url || "")
  }, [currentProfile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione uma imagem válida")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const fileExtension = file.name.split(".").pop()
      // Usando 'avatars' como bucket se for o padrão de avatars, mas mantendo 'posts' se for o seu bucket configurado
      const filePath = `public/${currentProfile.id}/avatar-${Date.now()}.${fileExtension}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      const imageUrl = publicUrlData?.publicUrl
      if (!imageUrl) throw new Error("Erro ao gerar URL pública.")

      setAvatarUrl(imageUrl)
    } catch (err) {
      console.error("Erro ao fazer upload:", err)
      setError("Erro ao fazer upload da imagem")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    // Se o nome de usuário é editável, esta validação é mantida:
    if (!isUsernameLocked && username.trim() === "") {
      setError("O nome de usuário não pode estar vazio")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("User")
        .update({
          // Se o username estiver bloqueado, não o atualize
          username: isUsernameLocked ? currentProfile.username : username.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
        })
        .eq("id", currentProfile.id)

      if (updateError) throw updateError

      onProfileUpdated()
      onOpenChange(false)
    } catch (err: any) {
      console.error("Erro ao atualizar perfil:", err)
      if (err.code === "23505") {
        setError("Este nome de usuário já está em uso")
      } else {
        setError("Erro ao atualizar perfil. Tente novamente.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Ajuste do DialogContent para o tema escuro:
        - bg-gray-900 ou bg-card (se configurado) para o fundo do modal
        - border-gray-700 para a borda
        - text-white/90 para o texto principal
      */}
      <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          {/* Ajuste do DialogTitle para cor de destaque (opcional, mas bom para Dark Mode) */}
          <DialogTitle className="text-xl text-white">Editar Perfil</DialogTitle>
          {/* DialogDescription para um texto mais suave */}
          <DialogDescription className="text-gray-400">Atualize suas informações de perfil</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4"> {/* Aumentei o espaçamento para melhor visualização */}
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            {/* Mantive a classe border-primary que deve ser o seu laranja/vermelho escuro */}
            <Avatar className="h-24 w-24 border-4 border-orange-600 dark:border-orange-500"> 
              <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={username} />
              <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                {/* Estilo do Botão "Alterar Foto" (Botão secundário, parecido com o Cancelar, mas com o ícone Upload)
                  Ajustei para ter o background da cor de destaque (primary), mas sem o gradiente.
                */}
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="text-sm">{isUploading ? "Enviando..." : "Alterar Foto"}</span>
                </div>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
                className="hidden"
              />
              <p className="text-xs text-gray-500">PNG, JPG ou GIF (máx. 5MB)</p>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Nome de Usuário</Label>
            <div className="relative">
              {/* Estilização do Input:
                - bg-gray-800 para um fundo escuro nos campos
                - text-white
                - border-gray-700
              */}
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu_username"
                disabled={isSaving || isUsernameLocked} // Desativa o campo se for bloqueado
                className="bg-gray-800 text-white border-gray-700 focus:ring-orange-600 pr-10" // Adicionado pr-10 para o ícone
              />
              {/* Ícone de Cadeado (Lock) - como na imagem */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              rows={4}
              disabled={isSaving}
              maxLength={200}
              // Estilização do Textarea: similar ao Input
              className="bg-gray-800 text-white border-gray-700 focus:ring-orange-600"
            />
            <p className="text-xs text-gray-500 text-right">{bio.length}/200</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Rodapé e Botões */}
        <div className="flex gap-2">
          {/* Botão Cancelar (Outline) */}
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isSaving} 
            className="flex-1 bg-transparent text-white border-gray-700 hover:bg-gray-700" // Ajuste para o tema escuro
          >
            Cancelar
          </Button>
          {/* Botão Salvar (Principal)
            Usando o mesmo gradiente do botão "Editar Perfil" da primeira imagem (Laranja/Vermelho escuro).
          */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isUploading} 
            className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700" 
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}