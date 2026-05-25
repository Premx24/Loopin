// Generate random room code
export const generateCode = () =>{
    return (
        Math.random().toString(36).substring(2,8).toUpperCase()
    )
}