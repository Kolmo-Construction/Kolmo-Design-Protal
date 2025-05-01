import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, FolderOpen, FileIcon, Image as ImageIcon, Upload } from "lucide-react";
import { formatDate, formatFileSize, getFileIcon } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { UploadDocumentForm } from "@/components/UploadDocumentForm";

interface ProjectDocumentsTabProps {
  projectId: number;
}

export function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { user } = useAuth();
  
  // Check if user can upload documents (admin or project manager)
  const canUpload = user && (user.role === 'admin' || user.role === 'projectManager');
  
  const {
    data: documents = [],
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments
  } = useQuery<Document[]>({
    queryKey: [`/api/projects/${projectId}/documents`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: projectId > 0,
  });

  // Handle document download
  const handleDownload = (document: Document) => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  // Handle successful upload
  const handleUploadSuccess = () => {
    setIsUploadDialogOpen(false);
    refetchDocuments();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Documents</CardTitle>
          <CardDescription>Access all documents related to your project</CardDescription>
        </div>
        
        {canUpload && (
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
                <DialogDescription>
                  Upload a document to this project. Max file size: 15MB.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <UploadDocumentForm 
                  projectId={projectId} 
                  onUploadSuccess={handleUploadSuccess} 
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoadingDocuments ? (
           <div className="flex justify-center py-8">
             <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-primary-50 p-3 mb-4">
              <FolderOpen className="h-6 w-6 text-primary-600" />
            </div>
            <p className="text-slate-500">No documents have been uploaded for this project yet.</p>
            {canUpload && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 gap-2"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4" />
                Upload Your First Document
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 border rounded-md hover:bg-slate-50 flex items-center justify-between transition-colors">
                <div className="flex items-center min-w-0 mr-4">
                  <div className="p-2 bg-slate-100 rounded mr-4 flex-shrink-0">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" title={doc.name}>{doc.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {doc.category ? doc.category.charAt(0).toUpperCase() + doc.category.slice(1) : 'Uncategorized'} • {formatFileSize(doc.fileSize)}
                    </p>
                    {doc.description && <p className="text-xs text-slate-400 mt-0.5 truncate" title={doc.description}>{doc.description}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">Uploaded on {formatDate(doc.createdAt)}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-primary-600 gap-2 flex-shrink-0"
                  onClick={() => handleDownload(doc)}
                  disabled={!doc.fileUrl}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}