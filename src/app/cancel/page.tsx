import CancelCheckout from "./cancel-checkout";
export default async function CancelPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;return <CancelCheckout order={typeof params.order==="string"?params.order:null}/>;}
