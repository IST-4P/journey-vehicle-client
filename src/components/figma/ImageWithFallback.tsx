import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const { src, alt, style, className, onError, ...rest } = props

  const normalizedSrc =
    typeof src === 'string' && src.trim() === '' ? undefined : src

  const renderPlaceholder = () => (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img
          src={ERROR_IMG_SRC}
          alt={alt ?? 'Image not available'}
          data-original-url={src ?? ''}
          {...rest}
        />
      </div>
    </div>
  )

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setDidError(true)
    onError?.(event)
  }

  if (!normalizedSrc || didError) {
    return renderPlaceholder()
  }

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  )
}
