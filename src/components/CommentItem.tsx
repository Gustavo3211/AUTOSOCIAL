// src/components/CommentItem.tsx
// (Assumindo que você tenha um componente similar)

import { User } from "lucide-react"; // Apenas um ícone de exemplo
import { Button } from "@/components/ui/button";

// Defina este tipo em um arquivo .types.ts ou no PostDetail
// Importante: precisa ter 'replies' e 'parent_comment_id'
export type CommentData = {
  id: number;
  created_at: string;
  content: string;
  parent_comment_id: number | null;
  User: {
    username: string;
    avatar_url?: string;
  } | null;
  replies: CommentData[]; // Comentários filhos
};

type CommentItemProps = {
  comment: CommentData;
  // Função para definir este comentário como alvo da resposta
  onStartReply: (comment: CommentData) => void;
};

// Helper para formatar o tempo (opcional)
const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "a";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min";
  return Math.floor(seconds) + "s";
};

export function CommentItem({ comment, onStartReply }: CommentItemProps) {
  const isParent = comment.parent_comment_id === null;

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <img
        src={comment.User?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${comment.User?.username}`}
        alt={comment.User?.username || "Avatar"}
        className="h-10 w-10 rounded-full bg-card/50 border border-orange-500/20"
      />

      <div className="flex-1 space-y-2">
        {/* Card do Comentário */}
        <div className="bg-card/30 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white/90 text-sm">{comment.User?.username || "Usuário"}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{comment.content}</p>
        </div>

        {/* Ações (Apenas para comentários PAI) */}
        {isParent && (
          <Button
            variant="link"
            size="sm"
            className="text-amber-400 p-0 h-auto"
            onClick={() => onStartReply(comment)}
          >
            Responder
          </Button>
        )}

        {/* Respostas (Comentários Filhos) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 pt-4">
            {comment.replies.map((reply) => (
              // Renderiza o filho, mas não passa a função 'onStartReply'
              // ou passa uma função vazia, para não responder a uma resposta.
              <CommentItem
                key={reply.id}
                comment={reply}
                onStartReply={() => {}} // Não permite responder a respostas
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}