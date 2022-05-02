- [Description](#description)
- [Installation](#installation)
- [Query building](#query-building)
- [Available methods](#available-methods)
- [Examples](#examples)
    - [save](#save)
    - [update](#update)
    - [delete](#delete)
- [Server side](#server-side)
- [Request flters](#request-flters)
- [Response filters](#response-filters)
- [Querying](#querying)
- [Seeders](#seeders)
  - [Usage](#usage)
  - [Example](#example)



## Description

What this package provides by default is to simulate an extraneous database, simply by creating a local json files to interact with. Practically it covers all basic and 


To 


Benefits

- unified API for all supported database drivers
- no dependency chain in local mode
- simulates a real database for testing or website preview 
- abstraction layer that decouples your code from databse implementation
- you can switch database provider with minimal or no changes to your code
- database driver specific methods are accessible

## Installation

````bash

    npm install --save

    or

    yarn add

````

## Query building



Typical GET api call should resemble:

http://somedomain/find/users

Where "find" is the requested database method and "users" is the target resource. The order is important.




## Available methods

Current list of available database actions

| Action     | Http Verb     | Description
| ---------  | ------------- | -------------------------------------------------------------------------------- |
| find       | GET           | Returns any number of records (all by default)
| find_one   | GET           | Returns a single record
| find_by_id | GET           | Returns a single record by _id field
| count      | GET           | Returns the count of records
| delete     | GET           | Deletes one or more records, based on the parameters
| save       | POST          | Inserts one or more records
| update     | PUT           | Updates one or more records

"save" and "update" calls should be sent with a http request body attached


## Examples





#### save

```js

    const multipleInsert = 
            [
                {
                    name: 'Super Slim Mouse',
                    color: 'Red',
                    material: 'plastic',
                    price: 150
                },
                {
                    name: 'Modern Headphones',
                    color: 'white',
                    material: 'aluminium',
                    price: 350

                },
                {
                    name: 'Ultra Wallet',
                    color: 'black',
                    material: 'leather',
                    price: 249.99
                }
            ]


    const singleInsert =  {
                    name: 'Super Slim Mouse',
                    color: 'Red',
                    material: 'plastic',
                    price: 150
                }


    const response = await fetch(`/some_endpoint/users/post`,{
        method: 'POST',
        body: JSON.stringify(single || multiple)

    })

```

#### update


```js

    // update records

    const dataToUpdate = {
        _id: {
            gt: 10
        },
        set: {
            price: 144
        }
    }

    const response = await fetch(`/some_endpoint/users/post`,{
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)

    })

```

#### delete

```js

    // Deletes records

    let url 


    const response = await fetch(`/some_endpoint/users/delete?_id.in=1,2,3`)

```

## Server side

```js
    
    // with nextjs 
    
    const {cachedConnection} = require('jb-nodejs-database-adapter')

    async function handler(req,res) {

        const {url, body} = req

        try {

            const db = await cachedConnection(pathToDbFiles, credentials = {}, 'local')
            
            const result = await db.run(url, body)

            res.status(200).json(result);

        } catch(e) {
            console.error(e)
        }

    }

```

```js
    
    // with express 
    
    const express = require("express");
    const app = express();
    const {cachedConnection} = require('jb-nodejs-database-adapter')

    async function handler(req,res) {

        const {url, body} = req

        try {

            const db = await cachedConnection(pathToDbFiles, credentials = {}, 'local')
            
            const result = await db.run(url, body)

            res.status(200).json(result);

        } catch(e) {
            console.error(e)
        }

    }

```


## Request flters

These are treated as reserved keywords and you should avoid using them as database table field names. 

| Param    | Usage             | Description                                                                                              |
| -------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| _id      | _id=              | Equal to resource _id field                                                                              |
| gt       | field.gt=         | Greater than target                                                                                      |
| lt       | field.lt=         | Lower than target                                                                                        |
| min      | field.min=        | Equal or greater than target                                                                             |
| max      | field.max=        | Equal or lower than target                                                                               |
| contains | field.contains=   | Includes a target substring                                                                              |
| in       | field.in=         | Equal to target or one of comma separated target values                                                  |
| not_in   | field.not_in=     | Different than target or comma separated target values                                                   |
| equals   | field.equals=     | Equal to target                                                                                          |
| not      | field.not=        | Different than target                                                                                    |

## Response filters

These are treated as reserved keywords and you should avoid using them as database table field names. 

| Param    | Usage                | Description                                                                                                                                                     |
| -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| only     | only=                | Specifies which fields should be included with the response. Accepts comma separated fields or a single field. Usage with 'except' in one query is prohibited.  |
| except   | except=              | Specifies which fields not to icnlude with the response. Accepts comma separated fields or a single field. Usage with 'only' in one query is prohibited.        |
| skip     | skip=                | How many records to skip. Accepts an integer value.                                                                                                             |
| limit    | limit=               | Caps results number to a specified integer value.                                                                                                               |
| sort     | sort.field_name=     | Sorts data by a specified field, multiple sort params are allowed, should be either ASC or DESC                                                                 |                     
| set      | set=                 | Includes a target substring                                                                                                                                     |


```js

    // example usage

    let apiCall = ""

    // delete resources with specified _id's

    apiCall = "/some_endpoint/resources/delete?_id.in=52,13,33"

    // get vehicles with _id value greater than 10 but without 20, maximum speed of 200, sort from lowest to highest speed and return only color and brand

    apiCall = "/some_endpoint/find/vehicles?_id.gt=10&_id.not=20&speed.max=200&sort.speed=ASC&only=color,brand"

    // get a single resource filtered out by nested fields

    apiCall = "/some_endpoint/find_one/products?price.min=20&department.category.subcategory=dolls"

```



## Querying

get all records

https://somedomain/find/users

filter out some records

https://somedomain/find/users?age.gt=30

limit

https://somedomain/find/users?limit=4

paginate

https://somedomain/find/users?skip=10&limit=10


## Seeders

You can use a built-in command line script to seed your local database.


### Usage

Method 1

Add a line to your package.json scripts as shown in the example below.

The first argument is the path to a directory in your app where seeders are stored.

The second path points to your local database files directory.

The third argument tells whether it should run in local mode (seed to a file).


```js

    // table name is required

    /* 
      count number is optional, defaults to 1 
      if no number is specified it will run a single seed
      if you want to seed a fixed number of data at once, an array of objects, usually that's what you need 
    */

    npm run seed_db users 77

    npm run seed_db categories // creates database records from an array of objects returned from the seeder
    
    or

    yarn seed_db users 77
    
```


```json

    {
        "scripts" : {
            // other scripts
            "seed_db": "seed path/to/seeders path/to/database_files local"
        }
    }



```


### Example

Seeder is just a function that returns an object or array of objects structured after you database model schema. 
Since it would bring an unncessary overhead the package has no built-in fake data generator. There are devoted packages like https://github.com/faker-js/faker you can try. 
Use anything that suits you.

```js

    // products.js

    // your seeder logic

    const getRandomNumber = (min, max) =>
    Math.floor(Math.random() * (max - min + 1) + min);

    const getRandomArrayElement = (arr) =>
    arr[Math.floor(Math.random() * arr.length)];

    const items = [
    "Bag",
    "Battery Pack",
    "Camera",
    "Charger",
    "Cooker",
    "Electric Car",
    "Flash Drive",
    "Fridge",
    "Frying Pan",
    "Headphones",
    "Keyboard",
    "Microphone",
    "Monitor",
    "Mouse",
    "Multitool",
    "Notebok",
    "Phone",
    "Power Bank",
    "Printer",
    "Soundsystem",
    "Speakers",
    "SSD",
    "Tablet",
    "Telescope",
    "TV",
    "Vacuum Cleaner",
    "Wallet",
    "Watch"
    ];

    const adjectives = [
    "Aluminium",
    "Cheap",
    "Elite",
    "Flexible",
    "Gaming",
    "Hybrid",
    "Mega",
    "Mini",
    "Mobile",
    "Modern",
    "Pro",
    "Slim",
    "Smart",
    "Ultra",
    "Universal",
    "Waterproof",
    "Wireless"
    ];

    const brands = [
    "Apple",
    "Dell",
    "Essentials",
    "Hitachi",
    "HP",
    "Huawei",
    "IBM",
    "Ilyama",
    "LG",
    "Microsoft",
    "Nintendo",
    "Philips",
    "Samsung",
    "Sony"
    ];


    // function that returns a seeder object

    module.exports = () => {
    return {
        name: `${getRandomArrayElement(brands)} ${getRandomArrayElement(
        adjectives
        )} ${getRandomArrayElement(items)}`,
        published: getRandomArrayElement([true, false]),
        created: new Date().toISOString(),
        in_stock: getRandomNumber(100, 0),
        sold: getRandomNumber(1001, 0),
        price: (getRandomNumber(2001, 1) + getRandomNumber(2001, 1)).toFixed(2)
    };
    };



```

Returning an array of objects in a single seed

```js

    // fetch data from external source or create your own

    module.exports = () => {

    return [
        {   
            name: 'LG Modern Headphones',
            in_stock: 45
        },
        {
            name: 'Samsung Ultra SSD',
            in_stock: 125
            
        },
        {
            name: 'Apple Slim Wallet',
            in_stock: 15

        },
        // ...etc
    ]


    }

```
