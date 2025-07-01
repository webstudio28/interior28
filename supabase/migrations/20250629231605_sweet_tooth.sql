/*
  # Create flats and rooms tables

  1. New Tables
    - `flats`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)
      - `building_name` (text)
      - `flat_number` (text)
      - `sq_meters` (numeric)
      - `number_of_rooms` (integer)
    - `rooms`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `flat_id` (uuid, foreign key to flats)
      - `room_name` (text)
      - `sq_meters` (numeric)
      - `original_image_url` (text, optional)
      - `transformed_image_url` (text, optional)
      - `interior_style` (text, optional)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Users can only access rooms belonging to their flats

  3. Storage
    - Create storage bucket for room images with appropriate policies
*/

-- Create flats table
CREATE TABLE IF NOT EXISTS public.flats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  building_name text NOT NULL,
  flat_number text NOT NULL,
  sq_meters numeric NOT NULL CHECK (sq_meters > 0),
  number_of_rooms integer NOT NULL DEFAULT 1 CHECK (number_of_rooms > 0)
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  flat_id uuid REFERENCES public.flats(id) ON DELETE CASCADE NOT NULL,
  room_name text NOT NULL,
  sq_meters numeric NOT NULL CHECK (sq_meters > 0),
  original_image_url text,
  transformed_image_url text,
  interior_style text
);

-- Enable Row Level Security
ALTER TABLE public.flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flats table
CREATE POLICY "Users can view their own flats"
  ON public.flats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flats"
  ON public.flats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flats"
  ON public.flats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flats"
  ON public.flats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for rooms table
CREATE POLICY "Users can view rooms of their flats"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.flats
      WHERE flats.id = rooms.flat_id
      AND flats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rooms into their flats"
  ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.flats
      WHERE flats.id = rooms.flat_id
      AND flats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rooms of their flats"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.flats
      WHERE flats.id = rooms.flat_id
      AND flats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rooms from their flats"
  ON public.rooms
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.flats
      WHERE flats.id = rooms.flat_id
      AND flats.user_id = auth.uid()
    )
  );

-- Create storage bucket for room images
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for room images
CREATE POLICY "Users can upload room images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'room-images');

CREATE POLICY "Users can view room images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'room-images');

CREATE POLICY "Users can update their room images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'room-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their room images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'room-images' AND auth.uid()::text = (storage.foldername(name))[1]);