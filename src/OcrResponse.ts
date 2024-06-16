export default interface OcrResponse {
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