import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export function useSupabaseStorage() {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, bucket: string) => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const filePath = `${uuidv4()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (path: string, bucket: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading
  };
}