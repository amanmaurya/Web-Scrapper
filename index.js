const puppeteer = require('puppeteer');
// const CREDS = require('./creds');
// const mongoose = require('mongoose');
const User = require('./models/user');
const cheerio = require('cheerio')
const fs = require('fs');

let rawdata = fs.readFileSync('./lyon/entretien_places.json');
let places = JSON.parse(rawdata);

const CREDS = {
    username: 'amanmaurya2010@gmail.com',
    password: 'kumaraman@9'
}

// console.log(places)
async function run() {
    const browser = await puppeteer.launch({
        // headless: false,
        // slowMo: 25 // slow down by 250ms
    });

    const page = await browser.newPage();

    const USERNAME_SELECTOR = '#input_search';
    const PASSWORD_SELECTOR = '#password';
    const BUTTON_SELECTOR = '#buttsearch';

    await page.goto('https://www.societe.com/');
    for (var im = 0; im < 3; im++) {

        // dom element selectors
        let pname =places[im].name;

        console.log('searching for....->',pname)

            await page.click(USERNAME_SELECTOR);
        //"AUTO'P DU TOP"
        await page.keyboard.type(pname);
        await page.click(BUTTON_SELECTOR);
        await page.waitForNavigation();

        await page.waitFor(2 * 1000);
// document.getElementsByClassName("txt-no-underline")[9].href
        const LIST_USERNAME_SELECTOR = '#search > .monocadre > a:nth-child(INDEX)';
        const LENGTH_SELECTOR_CLASS = '#search > .monocadre >.txt-no-underline'//'#search > .monocadre >.txt-no-underline';
        const numPages = 1 //await getNumPages(page);

        for (let h = 1; h <= numPages; h++) {
            // let pageUrl = searchUrl + '&p=' + h;
            // await page.goto(pageUrl);
            console.log(page.url(), '')

            let listUrl = await page.evaluate((sel) => {
                // console.log(sel,'sssssssssssssssssssssssssss')
                // return document.querySelectorAll('sel').length;
                return  JSON.stringify(document.querySelectorAll(sel))
                // return document.getElementsByClassName(sel)
            }, LENGTH_SELECTOR_CLASS);
                            console.log('listLength', JSON.parse(listUrl))

            let listLength=Object.keys(listUrl).length
            console.log('listLength', JSON.parse(listUrl),listLength,listUrl['0'])

            for (let i = 0; i <= 3; i = i++) {
                // change the index to the next child
                let usernameSelector =listUrl[i].href// LIST_USERNAME_SELECTOR.replace("INDEX", i);
                // let emailSelector = LIST_EMAIL_SELECTOR.replace("INDEX", i);

                // console.log('usernameSelector', usernameSelector, i)
                // let username = await page.evaluate((sel) => {
                //     return document.querySelector('txt-no-underline').getAttribute('href').replace('/', '');
                // }, usernameSelector);

                console.log(usernameSelector, ' -> ');
                if (!usernameSelector){
                    console.log('skipping......',usernameSelector)
                    // continue;
                }

                var uurl = usernameSelector//`https://www.societe.com/${username}`;
                var page1 = await browser.newPage();
                await page1.goto(uurl);
                await page1.waitFor(2 * 1000);
                let naf = await getNaf(page1);
                await page1.close()
                console.log('NAF->>>>>>>>>', naf)
                
            }
        }
    }

    browser.close();
}


async function getNaf(page) {


    let nafSelector = '#rensjur > tbody '
    let naf = await page.evaluate((sel) => {
        return document.querySelector(sel).innerHTML;
    }, nafSelector);

    let tr = naf.split('</tr>')

    let result = '';
    for (var i = 0; i < tr.length; i++) {
        let td = tr[i].split('</td>');
        if (td[0].indexOf('NAF') != -1) {
            result = td[1];
            i = 100000000000000000000000;
        }
    }

    return result.replace('<td>', '').trim();
}

async function getNumPages(page) {
    const NUM_USER_SELECTOR = '#js-pjax-container > div > div.col-12.col-md-9.float-left.px-2.pt-3.pt-md-0.codesearch-results > div > div.d-flex.flex-column.flex-md-row.flex-justify-between.border-bottom.pb-3.position-relative > h3';
    let inner = await page.evaluate((sel) => {
        let html = document.querySelector(sel).innerHTML;

        // format is: "69,803 users"
        return html.replace(',', '').replace('users', '').trim();
    }, NUM_USER_SELECTOR);

    const numUsers = parseInt(inner);

    console.log('numUsers: ', numUsers);

    /**
     * GitHub shows 10 resuls per page, so
     */
    return Math.ceil(numUsers / 10);
}

function upsertUser(userObj) {
    const DB_URL = 'mongodb://localhost/thal';

    if (mongoose.connection.readyState == 0) {
        mongoose.connect(DB_URL);
    }

    // if this email exists, update the entry, don't insert
    const conditions = {
        email: userObj.email
    };
    const options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    };

    User.findOneAndUpdate(conditions, userObj, options, (err, result) => {
        if (err) {
            throw err;
        }
    });
}

run();