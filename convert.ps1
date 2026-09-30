
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('C:\Users\haris\OneDrive\Desktop\Skyhour\test.docx')
$doc.SaveAs('C:\Users\haris\OneDrive\Desktop\Skyhour\test.pdf', 17)
$doc.Close()
$word.Quit()
