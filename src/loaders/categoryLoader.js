import DataLoader from "dataloader";
import Category from "../models/Category.js";

const createCategoryLoader = () => {
  return new DataLoader(async (categoryIds) => {
    console.log("CATEGORY BATCH:", categoryIds);
    const categories = await Category.find({
      _id: {
        $in: categoryIds
      }
    });

    const categoryMap = new Map(
      categories.map(category => [
        category._id.toString(),
        category
      ])
    );

    return categoryIds.map(
      id => categoryMap.get(id.toString()) || null
    );
  });
};

export default createCategoryLoader;