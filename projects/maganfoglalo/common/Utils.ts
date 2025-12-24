export default class Utils {
    private static KEY_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
    public static generateKey(length=10) {
        let result = "";
        for (let i = 0; i < length; i++) result += Utils.KEY_CHARS[Math.floor(Math.random() * Utils.KEY_CHARS.length)];
        return result;
    }
}