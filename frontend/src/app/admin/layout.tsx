'use client';

import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch,ApiError } from "@/src/lib/api";

export default function AdminLayout({
    children,
}:{
    children:React.ReactNode;
}){
    const router=useRouter();
    const[allowed,setAllowed]=useState(false);

    useEffect(()=>{
        async function checkAccess() {
            try{
                const user= await apiFetch<{role:'ADMIN'|'PLAYER'}>(
                    '/auth/me',
                );
                if(user.role==='ADMIN'){
                    setAllowed(true);
                }else{
                    router.replace('/challenges');
                }
            }catch(err){
                if(err instanceof ApiError && err.status===401){
                    localStorage.removeItem('token');
                }
                router.replace('/login');
            }
        }
        void checkAccess();
    },[router]);

    if(!allowed){
        return <p className="p-6">Checking access...</p>;
    }
    return <>{children}</>;
}