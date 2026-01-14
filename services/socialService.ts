import { supabase } from '../lib/supabase';
import { SharedVerse } from '../types';

export const socialService = {
    /**
     * Uploads a generated image to Supabase Storage and creates a record in the database.
     * Returns the public URL for sharing.
     */
    async createShareLink(verseId: string, imageFile: File): Promise<SharedVerse | null> {
        try {
            // 1. Upload Image
            const fileName = `${verseId}-${Date.now()}.png`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('share-images')
                .upload(fileName, imageFile);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                return null;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('share-images')
                .getPublicUrl(fileName);

            // 3. Create Database Record
            const { data: insertData, error: insertError } = await supabase
                .from('shared_verses')
                .insert([
                    {
                        verse_id: verseId,
                        image_url: publicUrl,
                    }
                ])
                .select()
                .single();

            if (insertError) {
                console.error('Error creating share record:', insertError);
                return null;
            }

            return insertData as SharedVerse;

        } catch (err) {
            console.error('Unexpected error in createShareLink:', err);
            return null;
        }
    }
};
