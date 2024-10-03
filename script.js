//note: payload changes every flyer release
const store = {
    "walmart": {
        "payload":"973511/6858601/dc0450ab94650cc5b5ad85304457bf3218dde1c8f5a3cd7c544ff28b616c0f98", 
        "merchant_id": "234"
    },
    "sobeys":{
        "payload":"963932/6849560/ba9fe6c4e569c8c4263762f460f2adc5585848e1f6b171e066ea7142ba73d5fa", 
        "merchant_id": "2072"        
    },
    "dominion":{
        "payload":"957010/6853658/c8f9464146cd1948eef74316708834979a9de1b0ea535998c53bb2c79766cb0f", 
        "merchant_id": "2334"            
    },
    "shoppers":{
        "payload":"953278/6853481/ffb50fcb7f8e2877ff5f934946b9992b0760f076ae4492e5f05fa940f3baffc4", 
        "merchant_id": "208"          
    }
}

const local_copy = [];
let date_exists = false;

async function scrape_data(store_instance) {
    const url = `https://cdn-gateflipp.flippback.com/storefront-payload/${store_instance.payload}?merchant_id=${store_instance.merchant_id}`;
    const products = [];
    await fetch(url)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(raw_data => 
        {
            const date = raw_data.children[0].attributes.getNamedItem("subtitle").textContent;
            store_instance.date = date;
            const unformatted_text = [];
            let substring = "";
            for (char of raw_data.children[0].outerHTML)
            {
                if(char !== "\n")
                {
                    substring+=char;
                }
                else
                {
                    unformatted_text.push(substring);
                    substring = "";
                }
            }
            const unformatted_products = [];
            for(item of unformatted_text)
            {
                if(item.trim().startsWith("<area"))
                {
                    unformatted_products.push(item.trim());
                }
            }
            const unformatted_product_labels = [];
            for(item of unformatted_products)
            {
                unformatted_product_labels.push(item.substring(item.indexOf("label"),item.indexOf(">")))
            }
            const filtered_product_labels = [];
            for (item of unformatted_product_labels)
            {
                if(item.includes("$") || item.includes("%"))
                {
                    filtered_product_labels.push(item.slice(7,item.indexOf("rect=")-2));
                }
            }
            filtered_product_labels.sort();
            for(item of filtered_product_labels)
            {
                const obj = {
                    "name": "",
                    "price": ""
                }
                const name = item.substring(0,item.indexOf("$"))
                if(name.includes(", ,"))
                {
                    obj.name = name.substring(0,name.indexOf(", ,")).trim();
                }
                else
                {
                    obj.name = name.trim();
                }
                obj.price = item.substring(item.indexOf("$")).trim();
                products.push(obj);
            }
        });
        return products;
}
async function get_data(){
    try{
        await Promise.all([scrape_data(store.sobeys),
            scrape_data(store.dominion),
            scrape_data(store.walmart),
            scrape_data(store.shoppers)]).then(data=> {
            local_copy.push(...data);
            buildHTML(data);
        });
    } catch(error){
        console.error(`Error fetching data`, error)
    }
}

function buildHTML(data)
{
    const build_table = (to_table, data) =>{
        const name = document.createElement("td");
        if(data.name === "")
        {
            name.classList.add("empty");
        }
        else
        {
            name.appendChild(document.createTextNode(data.name));            
        }
        const price = document.createElement("td");
        price.appendChild(document.createTextNode(data.price));
        const row = document.createElement("tr");
        row.appendChild(name);
        row.appendChild(price);
        to_table.appendChild(row);
    };

    const add_date = (flyer_date_container,flyer_date) =>{
        const text_container = document.createElement("p");
        const text = document.createTextNode(flyer_date);
        text_container.appendChild(text);
        flyer_date_container.appendChild(text_container);
    }

    const [sobeys, dominion, walmart,shoppers] = data;

    const dominion_table = document.querySelector("#dominion-data");
    const dominion_title = document.querySelector("#dominion-title");

    const walmart_table = document.querySelector("#walmart-data");
    const walmart_title = document.querySelector("#walmart-title");

    const sobeys_table = document.querySelector("#sobeys-data");
    const sobeys_title = document.querySelector("#sobeys-title");

    const shoppers_table = document.querySelector("#shoppers-data");
    const shoppers_title = document.querySelector("#shoppers-title");



    dominion.forEach(product =>{
        build_table(dominion_table,product);
    });
    if(!date_exists) add_date(dominion_title,store.dominion.date);

    walmart.forEach(product =>{
        build_table(walmart_table, product);
    });
    if(!date_exists) add_date(walmart_title,store.walmart.date);

    sobeys.forEach(product =>{
        build_table(sobeys_table, product);
    });   
    if(!date_exists) add_date(sobeys_title,store.sobeys.date);

    shoppers.forEach(product =>{
        build_table(shoppers_table, product);
    });   
    if(!date_exists) add_date(shoppers_title,store.shoppers.date);

    date_exists = true;
}

const fetch_data_button = document.querySelector("#fetch-data");
fetch_data_button.addEventListener("click",()=>{
    get_data();
    const search_container = document.createElement("div");
    search_container.classList.add("my-2");
    const input = document.createElement("input");
    input.placeholder="search"
    input.classList.add("mx-2");
    const search_button = document.createElement("button");
    search_button.type = "button";
    search_button.classList.add("btn","btn-success","mx-2");
    search_button.textContent="Submit";

    const reset_button = document.createElement("button");
    reset_button.type = "button";
    reset_button.classList.add("btn","btn-warning","mx-2");
    reset_button.id = "reset-data"
    reset_button.textContent="Reset";

    search_container.appendChild(input);
    search_container.appendChild(search_button);
    search_container.appendChild(reset_button);
    fetch_data_button.replaceWith(search_container);
    const search_data = () => {
        const dominion_table = document.querySelector("#dominion-data");
        const walmart_table = document.querySelector("#walmart-data");
        const sobeys_table = document.querySelector("#sobeys-data");
        const shoppers_table = document.querySelector("#shoppers-data");

        const tables = [dominion_table,walmart_table,sobeys_table,shoppers_table];

        const flag_products = table => {
            Array.from(table.children).forEach(child=>{
                const table_text_content = child.textContent.toLowerCase();
                const user_input = input.value.toLowerCase();
                if(!table_text_content.includes(user_input))
                {
                    child.classList.add("to-remove");
                }
                if( //included as substring, is contained within a word, is not the first word of the string
                table_text_content.includes(user_input) && 
                table_text_content[table_text_content.indexOf(user_input)-1] !== " " && 
                table_text_content.indexOf(user_input) !== 0) 
                {
                    child.classList.add("to-remove");
                }
            })
        }
        tables.forEach(table => flag_products(table));
        document.querySelectorAll(".to-remove").forEach(child => child.remove());        
    }
    search_button.addEventListener("click",()=>{
        search_data();
    });
    input.addEventListener("keypress",(evt)=>{
        if(evt.key === "Enter")
        {
            search_data();            
        }
    });
    reset_button.addEventListener("click",()=>{
        document.querySelectorAll("tbody tr").forEach(row=>row.remove());
        buildHTML(local_copy);
    });
});