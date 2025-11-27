-- Permet les messages avec content vide (pour images seules)
ALTER TABLE messages 
ALTER COLUMN content DROP NOT NULL;

-- Ajoute un check pour s'assurer qu'il y a au moins content OU images
ALTER TABLE messages
ADD CONSTRAINT content_or_images_required 
CHECK (
  (content IS NOT NULL AND content != '') 
  OR 
  (images IS NOT NULL AND array_length(images, 1) > 0)
);
