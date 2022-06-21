export function doPost(e: any): GoogleAppsScript.Content.TextOutput {
  // e.parameterでURL QueryのObejctが取得できる
  const jsonOut = ContentService.createTextOutput();
  //Mime TypeをJSONに設定
  jsonOut.setMimeType(ContentService.MimeType.JSON);
  //JSONテキストをセットする
  jsonOut.setContent(JSON.stringify({ hello: 'world do post' }));
  return jsonOut;
}
