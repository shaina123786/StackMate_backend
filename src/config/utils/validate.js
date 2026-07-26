
const validator = require('validator');

const validateSign = (req) => {
    const { firstName, lastName, emailId, password } = req.body;
    if (!firstName || !lastName) {
        throw new Error("This field is required"); 
    }
    else if (!validator.isEmail(emailId)) {
        throw new Error("please Enter correct EmailId");
    }
    else if (!validator.isStrongPassword(password)) {
        throw new Error("Enter stong passowrd");
    }
};

const validateEdit = (req) => {
    const  allowedEditFields = [
        "firstName",
        "lastName",
        "emailId",
        "Gender",
        "photoUrl",
        "age",
        "about",
        "skills",
    ];

    const isEditAllowed = Object.keys(req.body).every((field) => 
        allowedEditFields.includes(field)
    );
    return isEditAllowed;

}
module.exports = { validateSign,validateEdit };