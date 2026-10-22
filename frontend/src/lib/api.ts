const API_URL= process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error{
    constructor(public status:number,message:string){
        super(message);
    }
}

export function getToken(){
    return typeof window==='undefined'?null:localStorage.getItem('token');
}

export async function apiFetch<T>(path:string,options:RequestInit={}):Promise<T> {
    const token= getToken();
    const response=await fetch(`${API_URL}${path}`,{
        ...options,
        headers:{
            'Content-Type':'application/json',
            ...(token?{Authorization:`Bearer ${token}`}:{}),
            ...options.headers,
        },
    });
    const data = await response.json().catch(()=>null);

    if(!response.ok){
        const message=Array.isArray(data?.message)?data.message.join(','):data?.message;
        throw new ApiError(response.status,message ?? 'something went wrong');
    }
    return data as T;
}