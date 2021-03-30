///USAGE



make sure to npm install if its your fisrt clone!

git pull //to get latest code

npm run handleDuplicateNames //will do duplicate name function
npm run testForThree //will do testing for three or more function
npm run processResults //will do the merging of duplicate rows from the master datasheet

HOW TO UPDATE CSV FILE:
open package.json
see 'scripts'

find script you want to update file on: EXAMPLE
"handleDuplicateNames": "node hello-node.js --config=people,data/people.csv",

you can see a line that says --config=people,data/people.csv",

the value after the first comma is the path to the file you want to use, if you want to change to a file called 'allPeople.csv' update the line to look like this - 

"handleDuplicateNames": "node hello-node.js --config=people,data/allPeople.csv",

then run:
npm run handleDuplicateNames //this will run the script with a new file.



