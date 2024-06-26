import { modelCart } from "../models/cart.model.js";
import { modelProducts } from "../models/products.model.js";

class ColectionManagerCart {
    static cart = [];
    static data;

    static async getProducts(limit) {
        try {
            if (limit) {
                const products = await modelCart.find()
                this.cart = products;
                return limit === 0 ? products : products.slice(0, limit);
            } else {
                const products = await modelCart.find()
                return products;
            }
        }
        catch (error) {
            console.error('Error al leer el archivo', error)
        }
    }
    static async getProductCartById(id) {
        const products = await modelCart.findById(id);
        if (!products) {
            console.error('Producto no encontrado')
        }
        return products;
    }
    static async loadCartFromDataBase() {
        try {
            this.cart = await modelCart.find()
            console.log(this.cart)
        } catch (error) {
            console.error('Error al cargar el producto', error)
        }
    }
    static async addToCart(id) {
        try {
            const productAdd = await modelProducts.findById(id)
            // const productAdd2 = await modelCart.find().populate({ path: '_id', model: modelProducts })
            // console.log(productAdd2)

            if (productAdd) {
                const { id: productID, title, price, thumbnail, stock } = productAdd;
                const find = this.cart.find(product => product._product_id.toString() === id);
                if (find) {
                    find.quantity += 1;
                    await modelCart.updateOne({ _product_id: productID }, { $inc: { quantity: 1 } });
                } else {
                    const productCart = {
                        _product_id: productID,
                        title,
                        price,
                        thumbnail,
                        stock,
                        quantity: 1
                    }
                    this.cart.push(productCart)
                    await modelCart.deleteMany({ _product_id: productID });
                    await modelCart.create(productCart);
                }
                // const cartWhithoutId = this.cart.map(e => {
                //     const { id, ...rest } = e._doc ? e._doc : e;
                //     return rest
                // })
            } else {
                console.log('El producto que deseas agregar es incorrecto')
            }
        } catch (err) {
            console.error('Existe un error al intentar agregar tu producto al carrito', err)
        }
    }
    static async updateProduct(id, update) {
        try {
            const filter = id;
            const updateOne = update;
            const options = { new: true }
            const process = await modelCart.findByIdAndUpdate(filter, updateOne, options)
            return process
        }
        catch (error) {
            console.error('Existe un error al intentar actualizar el archivo', error)
        }
    }
    static async updateProductQuantity(id, quantity) {
        try {
            const filter = id;
            const update = {
                $set: { 'quantity': quantity }
            };
            const options = { new: true }
            const process = await modelCart.findOneAndUpdate(filter, update, options)
            return process
        }
        catch (error) {
            console.error('Existe un error al intentar actualizar la cantidad del archivo', error)
        }
    }

    static async deleteProductById(id, cid) {
        try {
            const filter = id;
            const filterProduct = cid
            const process = await modelCart.findOneAndDelete(filter);
            const processProducts = await modelCart.findByIdAndDelete(filterProduct)
            return process, processProducts
        }
        catch (error) {
            console.error('Existe un error al intentar eliminar el elemento del archivo', error)
        }
    }
    static async deleteAll() {
        try {
            const process = await modelCart.deleteMany({});
            return process
        }
        catch (error) {
            console.error('Existe un error al intentar eliminar todos los eleentos del carrito ', error)
            throw error
        }
    }

    static async sortProducts(sort) {
        try {
            if (sort === 0) {
                const products = await modelCart.aggregate([
                    { $sort: { _id: -1 } }
                ])
                return products
            } else if (sort === 1) {
                const products = await modelCart.aggregate([
                    { $sort: { _id: 1 } }
                ])
                return products
            }
        }
        catch (err) {
            console.error('Error en el servidor', err)
        }
    }


}




export { ColectionManagerCart }

