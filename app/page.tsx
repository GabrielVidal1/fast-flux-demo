"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

interface ImagePrediction {
  status: string;
  output: string[];
  metrics?: {
    predict_time: number;
  };
}

export default function Home() {
  const [text, setText] = useState('')
  const [images, setImages] = useState<ImagePrediction[]>([])
  const prevTextRef = useRef('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const storedImages = localStorage.getItem('generatedImages')
    if (storedImages) {
      setImages(JSON.parse(storedImages))
    }
  }, [])

  const generateImage = useCallback(() => {
    if (text && text !== prevTextRef.current) {
      prevTextRef.current = text
      fetch(`/api/generate-image?text=${encodeURIComponent(text)}`)
        .then(res => res.json())
        .then(data => {
          if (data.prediction.status === 'succeeded') {
            const updatedImages = [data.prediction, ...images]
            setImages(updatedImages)
            localStorage.setItem('generatedImages', JSON.stringify(updatedImages))
          }
        })
    }
  }, [text, images])

  useEffect(() => {
    const debounce = setTimeout(() => {
      generateImage()
    }, 300) // Debounce for 300ms

    return () => clearTimeout(debounce)
  }, [generateImage])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 p-4 sticky top-0 z-10 shadow-md">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder="Start typing to generate images..."
          className="w-full p-2 bg-transparent text-white placeholder-gray-400 overflow-hidden text-xl"
        />
      </header>
      <main className="flex-grow">
        <div className="masonry sm:masonry-sm md:masonry-md">
          {images.map((img, index) => (
            <div key={img.output[0]} className="masonry-item relative overflow-hidden">
              {img.status === "succeeded" && (
                <>
                  <Image
                    src={img.output[0]}
                    alt={`Generated image ${index + 1}`}
                    width={512}
                    height={512}
                    className="w-full h-auto object-cover"
                  />
                  {img.metrics && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute bottom-0 left-0 bg-black bg-opacity-70 text-gray-300 text-xs px-2 py-1">
                        {Math.round(img.metrics.predict_time * 1000)}ms
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}