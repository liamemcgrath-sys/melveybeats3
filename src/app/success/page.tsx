import PurchaseSuccess from "./purchase-success";
export default async function SuccessPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;return <PurchaseSuccess sessionId={typeof params.session_id==="string"?params.session_id:null}/>;}
