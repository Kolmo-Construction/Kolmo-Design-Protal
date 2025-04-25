import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ProgressUpdate, User } from "@shared/schema";
import { CheckCircle, AlertTriangle, Image as ImageIcon, FileText } from "lucide-react";

interface UpdateItemProps {
  update: ProgressUpdate & { createdBy?: User; media?: { mediaUrl: string; mediaType: string }[] };
  isLoading?: boolean;
}

export default function UpdateItem({ update, isLoading = false }: UpdateItemProps) {
  if (isLoading) {
    return (
      <div className="relative pb-8 animate-pulse">
        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true"></span>
        <div className="relative flex items-start space-x-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center ring-8 ring-white"></div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="h-4 w-1/3 bg-slate-200 rounded mb-2"></div>
            <div className="h-3 w-full bg-slate-200 rounded mb-2"></div>
            <div className="h-2 w-20 bg-slate-200 rounded mb-4"></div>
            <div className="h-16 w-16 bg-slate-200 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "milestone":
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case "issue":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "photo":
        return <ImageIcon className="h-5 w-5 text-primary-600" />;
      default:
        return <FileText className="h-5 w-5 text-slate-600" />;
    }
  };

  const getUpdateBgColor = (type: string) => {
    switch (type) {
      case "milestone":
        return "bg-blue-50";
      case "issue":
        return "bg-yellow-50";
      case "photo":
        return "bg-primary-50";
      default:
        return "bg-slate-50";
    }
  };

  const formattedTime = update.createdAt 
    ? formatDistanceToNow(new Date(update.createdAt), { addSuffix: true }) 
    : "recently";

  return (
    <li>
      <div className="relative pb-8">
        {/* Line connecting updates */}
        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true"></span>
        <div className="relative flex items-start space-x-3">
          <div className="relative">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white",
              getUpdateBgColor(update.updateType)
            )}>
              {getUpdateIcon(update.updateType)}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div>
              <div className="text-sm font-medium text-slate-800">
                {update.title}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {update.description}
              </p>
            </div>
            <div className="mt-2 text-sm text-slate-500">
              <p>{formattedTime} by {update.createdBy ? `${update.createdBy.firstName} ${update.createdBy.lastName}` : "Unknown"}</p>
            </div>
            {update.media && update.media.length > 0 && (
              <div className="mt-2 flex -space-x-2 overflow-hidden">
                {update.media.map((media, index) => (
                  <img 
                    key={index}
                    className="inline-block h-16 w-16 rounded-md ring-2 ring-white object-cover"
                    src={media.mediaUrl}
                    alt={`Update media ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
