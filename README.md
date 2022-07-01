# pdf-password-remover

This is simple password remover for the PDF files.

##### To Build #####
Built the project using 

`mvn clean install`

##### To Run #####
After building, we will get all the artifacts in the target folder. Execute the following command to remove the password for given file.

`java -jar .\pdf-password-remover.jar <absolute_path> <filename> <password>`

###### E.g: ######
 `java -jar .\pdf-password-remover.jar D:\folder pwd-protected.pdf dummy-password`