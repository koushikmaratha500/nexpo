CREATE POLICY "Public Read Access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'nexpo');

CREATE POLICY "Allow Authenticated Uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'nexpo');


CREATE POLICY "Allow Anonymous Uploads" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'nexpo');

CREATE POLICY "Allow Authenticated Updates" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'nexpo') 
WITH CHECK (bucket_id = 'nexpo');

CREATE POLICY "Allow Authenticated Deletions" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'nexpo');
