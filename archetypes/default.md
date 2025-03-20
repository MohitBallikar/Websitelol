+++
date = '{{ .Date }}'
draft = true
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
resume = '{{< embed-pdf url="./public/MohitBallikar.pdf" | Resume >}}'

+++
