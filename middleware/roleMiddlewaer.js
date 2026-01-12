const roleMiddelware = (role) =>{
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: "Accès refusé" });
        }
        next();
    };




}
module.exports=roleMiddelware;