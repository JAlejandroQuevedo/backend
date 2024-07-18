import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2'

mongoose.pluralize(null);

const collection = 'ticket';

const schema = new mongoose.Schema({
    // _product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    _code: { type: mongoose.Schema.Types.ObjectId, required: true },
    purchase_datetime: { type: String, required: true },
    amount: { type: Number, required: true },
    purchaser: { type: String, required: false },
});

const modelTicket = mongoose.model(collection, schema);

export { modelTicket };