import "dotenv/config";
import cors from "cors";
import express from "express";
import { MongoClient } from "mongodb";

const {
  CLIENT_ORIGIN = "http://localhost:5173",
  MONGODB_COLLECTION = "purchases",
  MONGODB_DB_NAME = "bolso_zen",
  MONGODB_URI,
  PORT = "4000",
} = process.env;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required in .env");
}

const app = express();
const client = new MongoClient(MONGODB_URI);

let collection;

const getCollection = async () => {
  if (collection) {
    return collection;
  }

  await client.connect();
  collection = client.db(MONGODB_DB_NAME).collection(MONGODB_COLLECTION);
  await collection.createIndex({ id: 1 }, { unique: true });

  return collection;
};

const sanitizePurchase = ({ _id, ...purchase }) => purchase;

const isValidPurchase = (purchase) =>
  purchase &&
  typeof purchase.id === "string" &&
  typeof purchase.descricao === "string" &&
  typeof purchase.dataCompra === "string" &&
  typeof purchase.valorTotal === "number" &&
  typeof purchase.valorParcela === "number";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_request, response) => {
  await getCollection();
  response.json({ ok: true });
});

app.get("/api/purchases", async (_request, response) => {
  try {
    const purchases = await (await getCollection())
      .find({}, { projection: { _id: 0 } })
      .sort({ dataCompra: -1, createdAt: -1 })
      .toArray();

    response.json({ purchases });
  } catch (error) {
    response.status(500).json({ message: "Failed to load purchases.", error });
  }
});

app.post("/api/purchases", async (request, response) => {
  const purchase = request.body;

  if (!isValidPurchase(purchase)) {
    response.status(400).json({ message: "Invalid purchase payload." });
    return;
  }

  try {
    await (await getCollection()).insertOne(purchase);
    response.status(201).json({ purchase });
  } catch (error) {
    response.status(500).json({ message: "Failed to create purchase.", error });
  }
});

app.put("/api/purchases/:id", async (request, response) => {
  const purchase = request.body;

  if (!isValidPurchase(purchase) || request.params.id !== purchase.id) {
    response.status(400).json({ message: "Invalid purchase payload." });
    return;
  }

  try {
    const result = await (await getCollection()).findOneAndReplace(
      { id: purchase.id },
      purchase,
      {
        returnDocument: "after",
        upsert: false,
        projection: { _id: 0 },
      },
    );

    if (!result) {
      response.status(404).json({ message: "Purchase not found." });
      return;
    }

    response.json({ purchase: sanitizePurchase(result) });
  } catch (error) {
    response.status(500).json({ message: "Failed to update purchase.", error });
  }
});

app.delete("/api/purchases/:id", async (request, response) => {
  try {
    const result = await (await getCollection()).deleteOne({ id: request.params.id });

    if (!result.deletedCount) {
      response.status(404).json({ message: "Purchase not found." });
      return;
    }

    response.status(204).send();
  } catch (error) {
    response.status(500).json({ message: "Failed to delete purchase.", error });
  }
});

app.post("/api/purchases/import", async (request, response) => {
  const { purchases } = request.body;

  if (!Array.isArray(purchases) || purchases.some((item) => !isValidPurchase(item))) {
    response.status(400).json({ message: "Invalid purchase list." });
    return;
  }

  try {
    const dbCollection = await getCollection();

    await dbCollection.deleteMany({});

    if (purchases.length > 0) {
      await dbCollection.insertMany(purchases);
    }

    response.json({ purchases });
  } catch (error) {
    response.status(500).json({ message: "Failed to import purchases.", error });
  }
});

const server = app.listen(Number(PORT), () => {
  console.log(`Bolso Zen API running on http://localhost:${PORT}`);
});

const closeServer = async () => {
  await client.close();
  server.close(() => process.exit(0));
};

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
