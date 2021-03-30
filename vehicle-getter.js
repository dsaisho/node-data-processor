const axios = require('axios').default;
const fs = require('fs');

const API = "https://shopify-test.magnaflow.com/api";
const years_url = `${API}/years`;
const makesByYearApi_url = `${API}/makes?filter[year]=`;
const MakeModel_json_FilePath = "./data/MakeModel_json.json"
const USE_DATA = true;

String.prototype.removeSpaces = function () {
    return this.replace(/\s/g, '');
}
String.prototype.spacesToDashes = function () {
    return this.replace(/\s/g, '-');
}

processVehicles(USE_DATA);


async function processVehicles(_useData = false) {
    const makeModel_data = _useData ? getSaved_MakeModel_data() : await getAndSave_MakeModel_data();

    const allModels = makeModel_data.reduce((_allModels, modelYearData) => {
        _allModels = _allModels.concat(modelYearData);
        return _allModels;
    }, [])

    const uniqModels = uniqBy(allModels, item => item.model.id);
    
    const alphabetizedModels = getAlphabetizedMakes(uniqModels);

    const makeModelList_markup = Object.values(alphabetizedModels).reduce((_markupList, _makeModels) => {
        const letterList = create_makeMarkupList(_makeModels);
        _markupList += letterList;
        return _markupList;
    }, "");

    createMarkup;

}
function create_makeMarkupList(_makeModels) {
    const title = _makeModels[0].data.make.name;
    const listItems = _makeModels.reduce((_listItems, model) => {
        const listItem = `
            <li class="make-list-item">
                <a>
                    ${
            model.name
        }
                </a>
            </li>
        `;
        _listItems += listItem;
        return _listItems;
    }, '');

    const completedList = `<ol id="${
        title.spacesToDashes()
    }" class="makeList">
        <li class="title">${title}</li>
        ${listItems}
    </ol>
    `
    return completedList;
}

function getAlphabetizedMakes(_allMakes) {
    return _allMakes.reduce((_acc, model) => {
        const make = model.make.name;
        const makeModelName = `${make} ${
            model.model.name
        }`;
        const makeModelObj = {
            name: makeModelName,
            data: model
        }

        if (!_acc.hasOwnProperty(make)) {
            _acc[make] = [];
        }
        _acc[make].push(makeModelObj);
        _acc[make].sort((a, b) => {
            const nameA = a.name.removeSpaces().toUpperCase();
            const nameB = b.name.removeSpaces().toUpperCase();
            if (nameA < nameB) {
                return -1;
            } else if (nameA > nameB) {
                return 1;
            }
            return 0;
        })
        return _acc

    }, {});
}

function uniqBy(a, key) {
    let seen = new Set();
    return a.filter(item => {
        let k = key(item);
        return seen.has(k) ? false : seen.add(k);
    });
}

function getSaved_MakeModel_data() {
    let fileData = fs.readFileSync(MakeModel_json_FilePath, 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
    });
    return JSON.parse(fileData);
}

async function getAndSave_MakeModel_data() {
    const years = await getYears();
    const MakeModel_data = await years.reduce(async (_modelData, year) => {
        const modelDataPromise = await _modelData;
        const modelsByYear = await getModelsByYear(year.name)

        modelDataPromise.push(modelsByYear);

        console.log(year);
        return modelDataPromise;
    }, Promise.resolve([]))

    const MakeModel_json = JSON.stringify(MakeModel_data);
    fs.writeFile(MakeModel_json_FilePath, MakeModel_json, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");
    });
    return MakeModel_data;
}

async function getYears() {
    const response = await axios.get(years_url);
    return response.data.data;
}

async function getModelsByYear(_year) {
    const makesByYear_url = `${makesByYearApi_url}${_year}`;
    const makesByYear = await axios.get(makesByYear_url);
    const makesByYear_data = makesByYear.data.data;
    const allMakeIds = makesByYear_data.reduce((_makeIds, make) => {
        return _makeIds += `${
            make.id
        },`
    }, '').replace(/,\s*$/, "");

    const modelsByYear_url = `${API}/base-vehicles?filter[year]=${_year}&filter[make]=${allMakeIds}`;
    const modelsByYear_request = await axios.get(modelsByYear_url);

    return modelsByYear_request.data.data;
}
