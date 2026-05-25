interface ButtonProps {
    text: string,
    size: "sm" | "lg"
}

const sizes = {
    "lg": "w-150 h-18 text-2xl",
    "sm": "w-60 h-16 text-lg"
}

export default function Button({text, size}:ButtonProps){
    return (
        <div className={`bg-white text-black rounded-lg flex items-center justify-center cursor-pointer active:scale-97 font-medium ${sizes[size]} `}>
            {text}
        </div>
    )
}