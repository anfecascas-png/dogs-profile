import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Dog } from '../../types'
import { getDogColor } from '../../constants/colors'

interface Props {
  dog: Dog
  colorIndex: number
  isEditor: boolean
  onPhotoUpdated: (url: string) => void
}

export function DogPhoto({ dog, colorIndex, isEditor, onPhotoUpdated }: Props) {
  const colors = getDogColor(colorIndex)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${dog.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(path)

      await supabase.from('dogs').update({ photo_url: publicUrl }).eq('id', dog.id)
      onPhotoUpdated(publicUrl)
    } catch (err) {
      console.error('Error subiendo foto:', err)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="relative w-24 h-24 mx-auto">
      <div
        className={`w-24 h-24 rounded-full ${colors.bgLight} border-4 border-white shadow-md overflow-hidden flex items-center justify-center`}
      >
        {dog.photo_url ? (
          <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🐾</span>
        )}
      </div>

      {isEditor && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 bg-terra-400 text-white rounded-full text-sm flex items-center justify-center shadow hover:bg-terra-500 transition disabled:opacity-50"
            title="Cambiar foto"
          >
            {uploading ? '⏳' : '📷'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  )
}
