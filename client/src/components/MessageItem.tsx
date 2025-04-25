import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, User } from "@shared/schema";

interface MessageItemProps {
  message: Message & { sender?: User };
  isLoading?: boolean;
}

export default function MessageItem({ message, isLoading = false }: MessageItemProps) {
  if (isLoading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="flex">
          <div className="h-10 w-10 rounded-full bg-slate-200"></div>
          <div className="ml-3 w-full">
            <div className="h-4 w-1/3 bg-slate-200 rounded mb-2"></div>
            <div className="h-3 w-full bg-slate-200 rounded mb-2"></div>
            <div className="h-3 w-full bg-slate-200 rounded mb-2"></div>
            <div className="h-2 w-20 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const formattedTime = message.createdAt 
    ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) 
    : "recently";

  return (
    <div className="p-4 hover:bg-slate-50 transition-colors">
      <div className="flex">
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={`https://ui-avatars.com/api/?name=${message.sender?.firstName || ""}+${message.sender?.lastName || ""}&background=3b82f6&color=fff`} 
            alt={`${message.sender?.firstName || ""} ${message.sender?.lastName || ""}`} 
          />
          <AvatarFallback>
            {message.sender?.firstName?.[0] || "U"}{message.sender?.lastName?.[0] || ""}
          </AvatarFallback>
        </Avatar>
        <div className="ml-3 w-full">
          <p className="text-sm font-medium text-slate-800">
            {message.sender 
              ? `${message.sender.firstName} ${message.sender.lastName} (${message.sender.role.charAt(0).toUpperCase() + message.sender.role.slice(1)})` 
              : "Unknown User"}
          </p>
          <p className="text-sm text-slate-500">{message.subject}: {message.message}</p>
          <p className="text-xs text-slate-400 mt-1">{formattedTime}</p>
        </div>
      </div>
    </div>
  );
}
