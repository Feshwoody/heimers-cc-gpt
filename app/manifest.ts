import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return{name:"Always Be Ready",short_name:"ABR",description:"Commander und Tablet Companion für Duo-Sessions",start_url:"/",display:"standalone",background_color:"#07080a",theme_color:"#0c0e11",orientation:"any",icons:[{src:"/abr-icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"}]}}
