import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions"
import axios, { AxiosRequestConfig } from "axios"

interface ImageAnalysisResponse {
  modelVersion: string
  metadata: {
    width: number
    height: number
  }
  readResult: {
    blocks: Array<{
      lines: Array<{
        text: string
        boundingPolygon: Array<{x: number, y: number}>
        words: Array<{
          text: string
          boundingPolygon: Array<{x: number, y: number}>
          confidence: number
        }>
      }>      
    }>
  }
}

export async function ocr(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`)
  // Read image data
  const imageData = await request.blob()
  const url = "https://azurecv1.cognitiveservices.azure.com/computervision/imageanalysis:analyze?features=read&model-version=latest&language=ja&api-version=2024-02-01"
  const options: AxiosRequestConfig = {
    headers: {
      "Ocp-Apim-Subscription-Key": "10c9c267b3e84772ad381bba747c33f0",
      "Content-Type": "application/octet-stream"
    }
  }
  try {
    const res = await axios.post<ImageAnalysisResponse>(url, imageData, options)
    return {jsonBody: res.data, status: res.status}
  } catch (err) {
    return {status: 500, jsonBody: err}
  }
}

app.http("ocr", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: ocr
})
