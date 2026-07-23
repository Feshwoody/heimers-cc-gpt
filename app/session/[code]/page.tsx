import { SessionRedirect } from "@/components/online/SessionRedirect";
export default async function SessionPage({params}:{params:Promise<{code:string}>}){const {code}=await params;return <SessionRedirect code={code.toUpperCase()}/>;}
