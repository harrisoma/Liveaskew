// Manual paid acceptance test only; submits one two-second synthetic video, never retries creation.
if (process.env.VIDEO_ACCEPTANCE !== "1") throw Error("Set VIDEO_ACCEPTANCE=1 explicitly");
import { getOnixusAiHeaders, getOnixusAiUrl } from "../src/lib/ai-gateway.server";
const headers={...getOnixusAiHeaders(),"Content-Type":"application/json"};
const submit=await fetch(getOnixusAiUrl("/videos/generations"),{method:"POST",headers,body:JSON.stringify({prompt:"The fictional adult in this reference outfit makes one small natural turn in place. Full body, shoes, bag and accessories remain visible. Stable camera, preserve face, outfit and body proportions. No text.",image_url:"data:image/png;base64," + Buffer.from(await Bun.file(new URL("./fixtures/person.png", import.meta.url)).arrayBuffer()).toString("base64"),width:720,height:1280,frames:48,fps:24,seed:401}),signal:AbortSignal.timeout(60000)});
const job=await submit.json();
console.log("VIDEO_QA_SUBMIT",JSON.stringify({http:submit.status,id:job.id,status:job.status,model:job.model,provider:job.onixus?.provider}));
if(!submit.ok||!job.id)throw Error("video_submit_failed_no_retry");
if(job.model!=="alibaba/wan-3.0"||job.onixus?.provider!=="openrouter")throw Error("unexpected_video_route");
for(let i=0;i<30;i++){
 await Bun.sleep(20000);
 const response=await fetch(getOnixusAiUrl("/videos/status/"+encodeURIComponent(job.id)),{headers,signal:AbortSignal.timeout(90000)});
 const state=await response.json();
 console.log("VIDEO_QA_STATUS",JSON.stringify({http:response.status,id:job.id,status:state.status}));
 if(!response.ok)throw Error("video_status_failed_do_not_resubmit");
 if(state.status==="COMPLETED"){
  const url=state.output?.video_url;
  if(!url)throw Error("video_missing_output");
  const media=await fetch(url,{signal:AbortSignal.timeout(60000)});
  const bytes=new Uint8Array(await media.arrayBuffer());
  if(!media.ok||bytes.length<1000||String.fromCharCode(...bytes.slice(4,8))!=="ftyp")throw Error("invalid_mp4");
  console.log("VIDEO_QA_PASS",JSON.stringify({model:state.model,provider:state.onixus?.provider,bytes:bytes.length,type:media.headers.get("content-type"),cost:state.output?.cost,url}));
  process.exit(0);
 }
 if(["FAILED","CANCELLED","TIMED_OUT"].includes(state.status))throw Error("video_terminal_failure");
}
throw Error("video_pending_do_not_resubmit");