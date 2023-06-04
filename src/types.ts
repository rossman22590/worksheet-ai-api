export type WorkSheetRes = {
  data: string,
  urlToPdf: string,
  pathToFile: string
}

export type ReqBody = {
  subject: string,
  topic: string,
  num: number,
  title: string
}