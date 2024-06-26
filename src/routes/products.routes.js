import { Router } from 'express';
import { data } from '../data/dataProductManager.js';
import { uploader } from '../uploader/uploader.js';
import { socketServer } from '../index.js';
import { modelProducts } from '../dao/models/products.model.js';
import { CollectionManager } from '../dao/manager/manager.mdb.js';



const router = Router();
const dataProducts = data;


router.get('/', (req, res) => {
    res.json('Por favor realiza una peticion')
})
router.get('/products/sort/:sort', async (req, res) => {
    try {
        const { sort } = req.params;
        const numberSort = +sort
        const products = await CollectionManager.sortProducts(numberSort);
        socketServer.emit('products', products);
        res.send({
            status: 1,
            products
        })
    }
    catch (err) {
        res.status(500).send('Error en el servidor', err)
    }
})
router.get('/products', async (req, res) => {
    try {    //NOTA: Si agregas el query despues del /products sin query, te arroja todos los productos aunque el codigo este correcto
        const limit = +req.query.limit || 0
        if (limit <= modelProducts.length) {
            const products = await CollectionManager.getProducts(limit);
            res.send({
                status: 1,
                payload: products
            })
            const product = await CollectionManager.getProducts();
            socketServer.emit('products', product);
        } else {
            res.status(404).json('Lo siento, no contamos con la cantidad de productos solicitada');
        }
    }
    catch (err) {
        console.error('Error al obtener los productos', err)
        res.status(500).send('Error interno del servidor')
    }
})

router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await CollectionManager.getProductById(id);
        //NOTA: Req params devuelve una cadena, no un numero
        if (!product) {
            res.status(404).json('Lo siento, el producto no existe');
            return;
        }
        res.status(200).send({
            origin: 'server1',
            payload: product
        })
        const productSocket = await CollectionManager.getProducts();
        socketServer.emit('products', productSocket);
    }
    catch (err) {
        console.error('Error al cargar el obtener por ID: ', err);
        res.status(500).json('Error interno del servidor')
    }
})
router.get('/products/pages/:page', async (req, res) => {
    try {
        const { page } = req.params;
        // const process = await modelProducts.paginate({ role: 'admin' }, { page: page, limit: 100 });
        const products = await modelProducts.paginate({}, { page: page, limit: 100 });
        res.status(200).send({
            origin: 'server1',
            products: products
        })
        const product = await CollectionManager.getProducts();
        socketServer.emit('products', product);
    }
    catch (err) {
        console.error('Error al obtener los datos de la pagina solicitada', err);
        res.status(500).json('Error interno del servidor')
    }
})
router.post('/products', uploader.single('thumbnail'), async (req, res) => {
    try {
        const { title, description, price, code, stock } = req.body;
        const thumbnail = req.file.destination;
        await CollectionManager.addProduct(title, description, price, code, stock, thumbnail);
        res.status(201).send('Producto agregado con exito');
        const products = await CollectionManager.getProducts();
        socketServer.emit('products', products);
    } catch (err) {
        console.error('Error al agregar el producto: ', err);
        res.status(500).json('Error interno en el servidor');
    }
})
router.put('/products/:id', async (req, res) => {
    try {
        const filter = { _id: req.params.id }
        const update = req.body;
        console.log(update)
        await CollectionManager.updateProduct(filter, update);
        res.status(200).send('Producto actualizado con exito');
        const product = await CollectionManager.getProducts();
        socketServer.emit('products', product);
    } catch (err) {
        console.error('Error al actualizar el producto por ID', err);
        res.status(500).send('Error al interno en el servidor');
    }
})
router.delete('/products/:id', async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        await CollectionManager.deleteProductById(filter);
        res.status(200).send('Producto eliminado correctamente');
        const product = await CollectionManager.getProducts();
        socketServer.emit('products', product);
    }
    catch (err) {
        console.error('Lo siento no se pudo eliminar el producto');
        res.status(500).send('Error interno del servidor')
    }
})
export { router, dataProducts }