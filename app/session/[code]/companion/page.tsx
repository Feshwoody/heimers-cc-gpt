import { OnlineSession } from "@/components/online/OnlineSession";
export default async function CompanionPage({params}:{params:Promise<{code:string}>}){const {code}=await params;return <OnlineSession code={code.toUpperCase()} mode="companion"/>;}
