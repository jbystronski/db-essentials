module.exports = () => {
  return [
    {
      name: "computer",
      value: 2983,
      color: "pink",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: true,
      nested: {
        parts: ["screen", "keyboard"],
        hidden: {
          value: "hidden computer value"
        }
      }
    },
    {
      name: "stereo",
      value: 312,
      color: "black",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: false,
      nested: {
        parts: ["charger", "speakers", "frame"],
        hidden: {
          value: "hidden stereo value"
        }
      }
    },
    {
      name: "mouse",
      value: 762,
      color: "white",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: true,
      nested: {
        parts: ["cable", "buttons"],
        hidden: {
          value: "hidden mouse value"
        }
      }
    },
    {
      name: "headphones",
      value: 342,
      color: "white",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: false,
      nested: {
        parts: ["cable", "box"],
        hidden: {
          value: "hidden headphones value"
        }
      }
    },
    {
      name: "printer",
      value: 1873,
      color: "black",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: true,
      nested: {
        parts: ["ink", "paper", "cable"],
        hidden: {
          value: "hidden printer value"
        }
      }
    },
    {
      name: "motorcycle",
      value: 12,
      color: "pink",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: false,
      nested: {
        parts: ["wheels", "fuel tank", "seat", "engine"],
        hidden: {
          value: "hidden motorcycle value"
        }
      }
    },
    {
      name: "book",
      value: 33,
      color: "brown",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: true,
      nested: {
        parts: ["cover", "paper"],
        hidden: {
          value: "hidden book value"
        }
      }
    },
    {
      name: "pen",
      value: 49,
      color: "blue",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: false,
      nested: {
        parts: null,
        hidden: {
          value: "hidden pen value"
        }
      }
    },
    {
      name: "sink",
      value: 764,
      color: "white",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: true,
      nested: {
        parts: null,
        hidden: {
          value: "hidden sink value"
        }
      }
    }
  ];
};
