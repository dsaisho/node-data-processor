const csv = require('csv-parser')
var curry = require('curry');
const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs')
const results = [];
/*
matches = 
[
      UPC(0), 
      Description(3), 
      Default cost Average Unit Cost(10), 
      Price(11), 
      Category(14), 
      Sub Category(15), 
      Sub Category 2 (16), 
      Vendor(19), 
      Matrix Group Color(24), 
      Matrix Group Size(25)  
      
    ]
*/
const storesStart = 27;
const storesLength = 15;
const newSkuLocation = 2;
const defaultCostLocation = 10;
const skuLocation = 1;
const matches = [0, 3, 11, 14, 15, 16, 19, 24, 25];


const command = 'people';
const fileToUse = "data/people.csv"

fs.createReadStream(fileToUse)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    if(command == "testFor3") testForThree(results)
    else if(command == "process") processResults(results) 
    else if(command == "people") handleDuplicateNames(results)
  });

  function testForThree(_results){
    /*
     returns info on groups that match for 3 or more
    */
    const startTime = new Date().toLocaleTimeString();
    let largeGroups = 0;
    let groupedObjects = []

      while(_results.length){
        //remove first value from _results
        let row = _results.pop();
        let rowData = objectValues(row);
        let groupedData = [];
        //filter results and keep non matched and pull matched
        _results = _results.filter(searchRow =>{
          let isMatch = true;
          //get data from current row
          let compareRowData = objectValues(searchRow);
          //loop for the matches array length to see if everything matches
          for(let i = 0; i < matches.length; i++){
            //if anyone doesnt match set isMatch to false
            if(compareRowData[matches[i]].toLowerCase() != rowData[matches[i]].toLowerCase()){
              isMatch = false;
            }
          }
          //EXIT LOOPING FOR MATCHES
          //if we have a match add it to a container that will hold all matches, and return false so it doesnt stay in results array
          if(isMatch){
            groupedData.push(searchRow);         
            return false;
          }else{
            return true;
          }
        })//EXIT FILTER
        //if we have a match of 3 or more, display information about them and push to grouped objects so we can make csv
        if(groupedData.length >= 2){
          groupedData.push(row);
          largeGroups ++;
          console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
          console.log("WE FOUND A MATCH OF " + (groupedData.length + 1))
          console.log("UPC", getObjectValue(row, 0))
          console.log("Custom Skus", getGroupedValues(groupedData, skuLocation))
          console.log("Vendor", getObjectValue(row, 19))
          console.log("Category", getObjectValue(row, 14))

          const infoObject = {
            matchSize: (groupedData.length),
            UPC: getObjectValue(row, 0),
            CustomSkus: getGroupedValues(groupedData, skuLocation),
            Vendor: getObjectValue(row, 19),
            Category: getObjectValue(row, 14)
          }
          groupedObjects.push(infoObject)
        }
    }//EXIT WHILE
    new ObjectsToCsv(groupedObjects).toDisk('./output/groupedObjects.csv');
    console.log("FOUND MATCHES:::: " + largeGroups)
    console.log("FINISHED  " + "Started at- " + startTime + ' ENDED AT- ' + new Date().toLocaleTimeString())
  }

  function processResults(_results){
    /*
      find rows that match all items in the matched array
      update store count and sku for matched items
      return csv file with updated matching rows
    */
    let newResults = [];
    let total = _results.length;
    const startTime = new Date().toLocaleTimeString();

    while(_results.length){
      //remove first value from _results
      let row = _results.pop();
      let rowData = objectValues(row);
      let groupedData = [];
      //filter results and keep non matched and pull matched
      _results = _results.filter(searchRow =>{
        let isMatch = true;
        //get data from current row
        let compareRowData = objectValues(searchRow);
        //loop for the matches array length to see if everything matches
        for(let i = 0; i < matches.length; i++){
          //if anyone doesnt match set isMatch to false
          if(compareRowData[matches[i]].toLowerCase() != rowData[matches[i]].toLowerCase()){
            isMatch = false;
          }
        }
        //EXIT LOOPING FOR MATCHES
        //if we have a match add it to a container that will hold all matches, and return false so it doesnt stay in results array
        if(isMatch){
          groupedData.push(searchRow);         
          return false;
        }else{
          return true;
        }
      })//EXIT FILTER
      //single entry gets added to new results
      if(groupedData.length == 0){
        newResults.push(row);
      }
      //if we have grouped data, make a new row with data combined, then add to new results
      else{
        console.log('we had a match!', groupedData.length)
        if(groupedData.length >= 3){
          let testVal = groupedData[1]
          console.log('problem')
        }
        //put copied sku in the default row in the new sku location
        let copiedRowSku = getObjectValue(groupedData[0], skuLocation);
        let setValueInRow = setObjValue(row);
        row = setValueInRow(copiedRowSku)(newSkuLocation);

        //update store quantity values
        //loop for each store
        for(let i = 0; i <= storesLength; i++ ){
          //get current store position
          let currentStore = storesStart + i;
          //get value from copied row at that store, and from the default row
          let copiedStoreValue = getObjectValueAsInt(groupedData[0], currentStore);
          let defaultStoreValue = getObjectValueAsInt(row, currentStore);
          //add new value to the default row store
          let storeValueSum = copiedStoreValue + defaultStoreValue;
          row = setValueInRow(storeValueSum)(currentStore);
        }
        //check if default cost is differnet, if so use the largest number
        let copiedDefaultCost = getObjectValueAsInt(groupedData[0], defaultCostLocation);
        let defaultCost = getObjectValueAsInt(row, defaultCostLocation);
        let newDefaultCost = copiedDefaultCost >= defaultCost ? copiedDefaultCost : defaultCost
        row = setValueInRow(newDefaultCost)(defaultCostLocation);
        newResults.push(row);
      }
      console.log(_results.length + ' remaining from: ' + total);
    }//EXIT WHILE
    //convert newResults object to a csv file
     new ObjectsToCsv(newResults).toDisk('./output/processed.csv');

     console.log("FINISHED  " + "Started at- " + startTime + ' ENDED AT- ' + new Date().toLocaleTimeString())
  }

  function handleDuplicateNames(_results){
    /*
      find rows that match all items in the matched array
      update store count and sku for matched items
      return csv file with updated matching rows
    */
    let newResults = [];
    let total = _results.length;
    const startTime = new Date().toLocaleTimeString();
    const startSize = _results.length;
    let isDupe = 0;
    while(_results.length){
      //remove first value from _results
      let row = _results.pop();
      let rowData = objectValues(row);
      let groupedData = [];
      //filter results and keep non matched and pull matched
      _results = _results.filter(searchRow =>{
        let isMatch = false;
        //get data from current row
        let compareRowData = objectValues(searchRow);
        
        /*
        //loop for the matches array length to see if everything matches
        for(let i = 0; i < matches.length; i++){
          //if anyone doesnt match set isMatch to false
          if(compareRowData[matches[i]].toLowerCase() != rowData[matches[i]].toLowerCase()){
            isMatch = false;
          }
        }
*/
        //get a match of first and last name
        if(rowData[1].toLowerCase() == compareRowData[1].toLowerCase() && rowData[2].toLowerCase() == compareRowData[2].toLowerCase() ){
          isMatch = true;
         /*
          const rowEmail = rowData[13];
          const compareEmail = compareRowData[13];

          if(
            rowEmail == compareEmail ||
            rowEmail == '' && compareEmail != '' ||
            compareEmail == '' && rowEmail != ''
            ){
              isMatch = true;
            }
        */
        }

        //EXIT LOOPING FOR MATCHES
        //if we have a match add it to a container that will hold all matches, and return false so it doesnt stay in results array
        if(isMatch){
          groupedData.push(searchRow);         
          return false;
        }else{
          return true;
        }
      })//EXIT FILTER
      //single entry gets added to new results
      if(groupedData.length == 0){
       // newResults.push(row);
      }
      //if we have grouped data, make a new row with data combined, then add to new results
      else{
        console.log('we had a match!', groupedData.length)
        isDupe ++;
        //get the first value in the grouped data

        Object.keys(row).map((key,index) => {//loop keys in that row so we look at every value
          let val = row[key];//grab a value

          let updatedVal = '';//prepare for an updated value
          if(!val){//if there is no value, check the other rows for a value
           val = groupedData.reduce((_acc,_val,_index)=>{//loop through other rows
              if(_acc) return _acc;//if we set a value, just keep it and dont care what the rest of the values are.

              const compareRowVal = _val[key] //get current key value from row
              if(compareRowVal){ //check if it has a value, if so then set it to the accum and return
                _acc = compareRowVal ? compareRowVal : '';
                return _acc;
              }
            },'')
          }
          return setObjValue(row, val, index)//set our row data to the updated data
        });
        newResults.push(row);//add row to the list
      }
     
      console.log(_results.length + ' remaining from: ' + total);
    }//EXIT WHILE
    //convert newResults object to a csv file
    console.log("OLD SIZE:",startSize, "NEW SIZE:", newResults.length, "TOTAL DUPLICATED:",isDupe )
     new ObjectsToCsv(newResults).toDisk('./output/updated-people.csv');

     console.log("FINISHED  " + "Started at- " + startTime + ' ENDED AT- ' + new Date().toLocaleTimeString())
  }

  function objectValues(_obj){
    return Object.keys(_obj).map((key,index) => {
      return _obj[key];
    });
  }

  var setObjValue = curry((_obj,_val,_location) =>{
    Object.keys(_obj).map((key,index) =>{
      if(index == _location){
        _obj[key] = _val;
      }
    })
    return _obj;
  })

  function setObjectValue(_obj,_val,_location){
    Object.keys(_obj).map((key,index) =>{
      if(index == _location){
        _obj[key] = _val;
      }
    })
    return _obj;
  }

  function getObjectValue(_obj,_valueLocation){
    let val = null;
    Object.keys(_obj).map((key,index) =>{
      if(index == _valueLocation){
        val = _obj[key];
      }
    });
    return val;
  }

  function getObjectValueAsInt(_obj, _valLocation){
    let val = parseFloat(getObjectValue(_obj, _valLocation));
    return isNaN(val) ? 0 : val;
  }

  function getGroupedValues(_rows, _valueLocation){
    //gets array of same objects and combines values into a comma seperated string
    let val = _rows.reduce((acc,item)=>{
      acc += getObjectValue(item, _valueLocation) + ', '; 
      return acc
    },'')
    //remove last comma
    val = val.replace(/,\s*$/, "")
    return val;
  }

