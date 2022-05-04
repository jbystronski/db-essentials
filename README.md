- [Description](#description)
- [Installation](#installation)
- [Query building](#query-building)
- [Available methods](#available-methods)
  - [Examples](#examples)
    - [Save](#save)
    - [Update](#update)
    - [Delete](#delete)
- [Server side](#server-side)
- [Request filters](#request-filters)
- [Response modifiers](#response-modifiers)
- [Querying](#querying)
  - [General](#general)
  - [Run from terminal](#run-from-terminal)
    - [Usage](#usage)
    - [Example](#example)
- [Seeders](#seeders)
  - [Usage](#usage-1)
  - [Example](#example-1)



## Description

In essence this package is a local database manager. Each database collection is stored as a JSON file. This serves an alternative if you don't want or for some reason can't hook up to an external database source. You can set your database to "local" or "no_persist" mode. The latter is a default setting, it ignores any modifications made to database records (like deleting, saving or updating records), however it still simulates them, so it's best for a real experience website previews in production. The "local" mode allows for complete data manipulation and it's best suited for development stage.

The package itself is bare bones, it comes with no dependecy chain and regardless of that it still covers all basic to moderate database necessities.
The 'no_persist' mode is best for website previews, when you want the user to perform certain actions that simulate real effect on records.
Beacause it relies on internal sources only, data objects are build on the fly and it works quite fast, though shortcomings of this approach are obvious.

As of recently, there is the db-essentials-mongo module available. It comes with the same unified api and allows to easily switch back and forth without no changes to the code. More implementations are considered. 

  


## Installation

````bash

    npm install db-essentials --save

    or

    yarn add db-essentials

````

## Query building



Typical GET api call should resemble:

http://somedomain/find/users

Where "find" is the requested database method and "users" is the target resource. The order is important.




## Available methods

Current list of available database actions

| Action         | Http Verb     | Description
| -------------- | ------------- | -------------------------------------------------------------------------------- |
| find           | GET           | Returns any number of records (all by default), based on provided filters
| find_one       | GET           | Returns a single record based on provided filters
| count          | GET           | Returns the count of records
| delete_one     | DELETE        | Deletes a record that matches the filters
| delete_many    | DELETE        | Deletes all records that match the filters
| save_one       | POST          | Inserts an object into the database
| save_many      | POST          | Inserts an array of objects into the database
| update_one     | PUT           | Updates the first record that matches the filters 
| update_many    | PUT           | Updates all records that match the filters

"save" and "update" calls should be sent with a http request body attached


### Examples


#### Save

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


    const response = await fetch(`/some_endpoint/save_one/item`,{
        method: 'POST',
        body: JSON.stringify(single || multiple)

    })

```

#### Update


```js

    // update records

    const dataToUpdate = {
        _id: {
            _gt: 10
        },
        _set: {
            price: 144
        }
    }

    const response = await fetch(`/some_endpoint/users/post`,{
        method: 'PUT',
        body: JSON.stringify(dataToUpdate)

    })

```

#### Delete

```js

    // Deletes records

    let url 


    const response = await fetch(`/some_endpoint/users/delete?_id.in=1,2,3`)

```

## Server side

```js
    
    // with nextjs 
    
    const {cachedConnection} = require('@db-essentials')

    async function handler(req,res) {

        const {url, body} = req

        try {

            const db = await cachedConnection('local', {localPath: 'PATH/TO/LOCAL_DB_FILES})
            
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
    const {cachedConnection} = require('@db-essentials')

    async function handler(req,res) {

        const {url, body} = req

        try {

            const db = await cachedConnection('local', {localPath: "/PATH/TO/DB_FILES"})
            
            const result = await db.run(url, body)

            res.status(200).json(result);

        } catch(e) {
            console.error(e)
        }

    }

```


## Request filters

These are treated as reserved keywords and you should avoid using them as database table field names.<br>Filters can access deep nested fields, as example: field.nested.nested._exists=true 

| Param           | Usage                      | Description                                                                                              |
| --------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| _id             | _id=                       | Equal to resource _id field. You can chain filters: _id._in=1,2,3                                        |
| _gt             | field._gt=                 | Greater than target                                                                                      |
| _gte            | field._gte=                | Equal or greater than target                                                                             |
| _lt             | field._lt=                 | Lower than target                                                                                        |
| _lte            | field._lte=                | Equal or lower than target                                                                               |
| _contains       | field._contains=           | Includes a target substring                                                                              |
| _in             | field._in=                 | Equal to target or one of comma separated target values                                                  |
| _not_in         | field._not_in=             | Different than target or comma separated target values                                                   |
| _equals         | field._equals=             | Equal to target                                                                                          |
| _not_equal      | field._not_equal=          | Different than target                                                                                    |
| _exists         | field._exists=             | Checks if the value exists, "pass" true or "false"                                                       |
| _type           | field._type=               | Checks if the value is of given type: string, null, date,  ...etc.<br>You can also pass an array of types to evaluate, field._type=null,date                                      |
| _regex          | field._regex=              | Evaluates value based on a regex expression                                                              |
| _all            | field._all=v1,v2,v3,...    | Checks if an array field contains all requested values                                                   |
| _array_size     | field._array_size=[num]    | Checks if the array field is of specified size                                                           | 


## Response modifiers

These are treated as reserved keywords and you should avoid using them as database table field names. 

| Param     | Usage                  | Description                                                                                                                                                     |
| --------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _only     | _only=                 | Specifies which fields should be included with the response. Accepts comma separated fields or a single field. Usage with 'except' in one query is prohibited.  |
| _except   | _except=               | Specifies which fields not to icnlude with the response. Accepts comma separated fields or a single field. Usage with 'only' in one query is prohibited.        |
| _skip     | _skip=                 | How many records to skip. Accepts an integer value.                                                                                                             |
| _limit    | _limit=                | Caps results number to a specified integer value.                                                                                                               |
| _sort     | _sort.fieldName=       | Sorts data by a specified field, multiple sort params are allowed, should be either 1 (ascending order) or -1 (descending oreder)                               |                     
| _set      | _set=                  | Sets a value to the target value                                                                                                                                |
| _and      | _and.field=            | All fields must match the query: _and.name=someName&_and.value._gt=4                                                                                            | 
| _or       | _or.field=             | Specifies alternative filters and returns the first match: _or.fieldName=value&_or.orOtherField._gt=4                                                           |
| _nor      | _nor.field=            | No field can match the query: _nor.name=book&_nor.price._gt=19.99                                                                                               |

```js

    // example usage

    let apiCall = ""

    // delete resources with specified _id's

    apiCall = "/some_endpoint/resources/delete?_id._in=52,13,33"

    // get vehicles with _id value greater than 10 but without 20, maximum speed of 200, sort from lowest to highest speed and return only color and brand

    apiCall = "/some_endpoint/find/vehicles?_id._gt=10&_id.not=20&speed._lte=200&_sort.speed=ASC&_only=color,brand"

    // get a single resource filtered out by nested fields

    apiCall = "/some_endpoint/find_one/products?price._lte=20&department.category.subcategory=dolls"

```



## Querying

### General

get all records

https://somedomain/find/users

filter out some records

https://somedomain/find/users?age._gt=30


paginatation example

https://somedomain/find/users?_skip=10&_limit=10


### Run from terminal

#### Usage

Include this line in you package json scripts

```json

    // you can name the command anything you want, in this example it's just query

    {
        "scripts" : {
            // other scripts
            "query" : "db-essentials-query path=./PATH/TO/LOCAL_DATABASE mode=local
        }
    }


```
#### Example

```js

    npm run

    // or

    yarn query find/users?_only=name,age&_limit=15 true

    // pass true at the end if you want to see the result as a string, otherwise you can leave it

```


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
