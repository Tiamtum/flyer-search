//note: payload changes every flyer release
const store = {
    "walmart": {
        "payload":"973509/6814397/b1ba8eb3c50f0e1f10ab6181af23bcc1ff3bc8587aaa782204cdc2c052e57c77", 
        "merchant_id": "234"
    },
    "sobeys":{
        "payload":"963930/6829406/7672c60475a20a2ee3c291c6cda1602fb49680c39ac1bc5173f022849b45191e", 
        "merchant_id": "2072"        
    },
    "dominion":{
        "payload":"957009/6839096/9a07ad8353c3cc2e1f47aee32b3124dd47b18641ae3501714fe1fcb6f3615a9e", 
        "merchant_id": "2334"            
    }
}

const local_copy = [];

async function scrape_data(store) {
    const url = `https://cdn-gateflipp.flippback.com/storefront-payload/${store.payload}?merchant_id=${store.merchant_id}`;
    const products = [];
    await fetch(url)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(raw_data => 
        {
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
        await Promise.all([scrape_data(store.sobeys),scrape_data(store.dominion),scrape_data(store.walmart)]).then(data=> {
            local_copy.push(...data);
            buildHTML(data);
        });
    } catch(error){
        console.error(`Error fetching data`, error)
    }
}

function buildHTML(data)
{
    const assemble = (to_table,data) =>{
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
    const [sobeys, dominion, walmart] = data;
    const dominion_table = document.querySelector("#dominion-data");
    const walmart_table = document.querySelector("#walmart-data");
    const sobeys_table = document.querySelector("#sobeys-data");

    dominion.forEach(product =>{
        assemble(dominion_table,product);
    });

    walmart.forEach(product =>{
        assemble(walmart_table,product);
    });

    sobeys.forEach(product =>{
        assemble(sobeys_table,product);
    });   
}


const fetch_data_button = document.querySelector("#fetch-data");
fetch_data_button.addEventListener("click",()=>{
    get_data();
    
    const search_container = document.createElement("div");
    search_container.classList.add("my-3");

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
   
   
    button.addEventListener("click",()=>{
        const dominion_table = document.querySelector("#dominion-data");
        const walmart_table = document.querySelector("#walmart-data");
        const sobeys_table = document.querySelector("#sobeys-data");
        const tables = [dominion_table,walmart_table,sobeys_table];

        const flag_products = table => {
            Array.from(table.children).forEach(child=>{
                if(!child.textContent.toLowerCase().includes(input.value.toLowerCase()))
                {
                    child.classList.add("to-remove");
                }                
            })
        }

        tables.forEach(table => flag_products(table));

        document.querySelectorAll(".to-remove").forEach(child => child.remove());
    });
})

document.querySelector("#reset-data").addEventListener("click",()=>{
    document.querySelectorAll("tbody tr").forEach(row=>row.remove());
    buildHTML(local_copy);
});