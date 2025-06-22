import React, { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Tag, 
  Camera, 
  MapPin, 
  Calendar,
  FileImage,
  Loader2
} from 'lucide-react';

// Validation schema for the upload form
const uploadFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().default('general'),
  projectId: z.number().optional(),
  tags: z.array(z.string()).default([]),
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

interface ImageWithPreview {
  file: File;
  preview: string;
  id: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    type: string;
    lastModified: number;
    exif?: any;
  };
}

interface AdminImageUploaderProps {
  projectId?: number;
  onUploadComplete?: () => void;
}

export function AdminImageUploader({ projectId, onUploadComplete }: AdminImageUploaderProps) {
  const [selectedImages, setSelectedImages] = useState<ImageWithPreview[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'general',
      projectId: projectId,
      tags: [],
    },
  });

  // Extract EXIF and metadata from image files
  const extractImageMetadata = useCallback(async (file: File): Promise<ImageWithPreview['metadata']> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const metadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };
        resolve(metadata);
      };
      img.onerror = () => {
        resolve({
          width: 0,
          height: 0,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle file selection with metadata extraction
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast({
        title: 'Invalid Files',
        description: 'Please select only image files',
        variant: 'destructive',
      });
      return;
    }

    const newImages: ImageWithPreview[] = [];

    for (const file of imageFiles) {
      const id = Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);
      const metadata = await extractImageMetadata(file);

      newImages.push({
        file,
        preview,
        id,
        metadata,
      });
    }

    setSelectedImages((prev) => [...prev, ...newImages]);

    // Auto-populate title if it's empty and we have images
    if (!form.getValues('title') && newImages.length > 0) {
      const firstImage = newImages[0];
      const baseName = firstImage.file.name.replace(/\.[^/.]+$/, '');
      form.setValue('title', baseName);
    }
  }, [form, toast, extractImageMetadata]);

  // Remove image from selection
  const removeImage = useCallback((id: string) => {
    setSelectedImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      // Clean up object URL
      const toRemove = prev.find((img) => img.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.preview);
      }
      return updated;
    });
  }, []);

  // Add tag to form
  const addTag = useCallback(() => {
    if (!currentTag.trim()) return;
    
    const currentTags = form.getValues('tags');
    if (!currentTags.includes(currentTag.trim())) {
      form.setValue('tags', [...currentTags, currentTag.trim()]);
    }
    setCurrentTag('');
  }, [currentTag, form]);

  // Remove tag from form
  const removeTag = useCallback((tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  }, [form]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      if (selectedImages.length === 0) {
        throw new Error('No images selected');
      }

      const results = [];

      for (const imageData of selectedImages) {
        const formData = new FormData();
        formData.append('image', imageData.file);
        formData.append('title', data.title);
        formData.append('description', data.description || '');
        formData.append('category', data.category);
        formData.append('tags', JSON.stringify(data.tags));
        formData.append('metadata', JSON.stringify(imageData.metadata));
        
        if (data.projectId) {
          formData.append('projectId', data.projectId.toString());
        }

        // Simulate upload progress
        setUploadProgress(prev => ({ ...prev, [imageData.id]: 0 }));

        const response = await fetch('/api/admin/images', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }

        setUploadProgress(prev => ({ ...prev, [imageData.id]: 100 }));
        const result = await response.json();
        results.push(result);
      }

      return results;
    },
    onSuccess: (results) => {
      toast({
        title: 'Upload Successful',
        description: `${results.length} image(s) uploaded successfully`,
      });

      // Reset form and images
      form.reset();
      selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
      setSelectedImages([]);
      setUploadProgress({});

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
      
      onUploadComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
      setUploadProgress({});
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    uploadMutation.mutate(data);
  });

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Admin Image Uploader
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection Area */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Upload Images</p>
              <p className="text-sm text-muted-foreground">
                Select multiple images from your camera roll. All metadata will be preserved.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileImage className="h-4 w-4 mr-2" />
              Choose Images
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Selected Images Preview */}
        {selectedImages.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Selected Images ({selectedImages.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Upload Progress */}
                  {uploadProgress[image.id] !== undefined && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="text-center text-white">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <Progress 
                          value={uploadProgress[image.id]} 
                          className="w-16 h-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={uploadMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Image Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 mb-1">
                      <ImageIcon className="h-3 w-3" />
                      {image.metadata?.width}x{image.metadata?.height}
                    </div>
                    <div className="truncate">{image.file.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="Enter image title"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(value) => form.setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="progress">Progress Photos</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="before_after">Before/After</SelectItem>
                  <SelectItem value="issues">Issues/Problems</SelectItem>
                  <SelectItem value="completed">Completed Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Add a description for these images..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Tag className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            
            {/* Display Tags */}
            {form.watch('tags').length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.watch('tags').map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={selectedImages.length === 0 || uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}