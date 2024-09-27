//note: payload changes every flyer release
const store = {
    "walmart": {
        "payload":"973510/6828455/e8ad3f67a891cc32628087a7b2c53b56e0e2c313ed81018093c836986ca3f9f5", 
        "merchant_id": "234"
    },
    "sobeys":{
        "payload":"963930/6829406/7672c60475a20a2ee3c291c6cda1602fb49680c39ac1bc5173f022849b45191e", 
        "merchant_id": "2072"        
    },
    "dominion":{
        "payload":"957009/6839096/9a07ad8353c3cc2e1f47aee32b3124dd47b18641ae3501714fe1fcb6f3615a9e", 
        "merchant_id": "2334"            
    },
    "shoppers":{
        "payload":"953277/6808871/ce122d0a035fdff1c2582505f7c2b50dc8121ae89c2fae1bd2a4ed46fd4b7bb1", 
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
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("btn","btn-success","mx-2");
    button.textContent="Submit";
    search_container.appendChild(input);
    search_container.appendChild(button);
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
    button.addEventListener("click",()=>{
        search_data();
    });
    input.addEventListener("keypress",(evt)=>{
        if(evt.key === "Enter")
        {
            search_data();            
        }
    });
});

document.querySelector("#reset-data").addEventListener("click",()=>{
    document.querySelectorAll("tbody tr").forEach(row=>row.remove());
    buildHTML(local_copy);
});