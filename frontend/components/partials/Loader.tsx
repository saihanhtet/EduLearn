import React from 'react'

interface LoaderProps {
    isLoading?: boolean
}

const Loader = ({ isLoading = false }: LoaderProps) => {
    if (!isLoading) return null

    return (
        <div className="w-full h-96 flex flex-col items-center justify-end gap-1.5">
            <div className="flex flex-row gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce"></div>
                <div
                    className="w-3 h-3 rounded-full bg-red-500 animate-bounce [animation-delay:-.3s]"
                ></div>
                <div
                    className="w-3 h-3 rounded-full bg-red-500 animate-bounce [animation-delay:-.5s]"
                ></div>
            </div>
            <p className='text-muted-foreground font-mono'>Loading</p>
        </div>
    )
}

export default Loader
