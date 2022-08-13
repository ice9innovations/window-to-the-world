<?PHP

class Thumbnail {
    private $source;
 
    public function __construct($sourceImagePath) {
        $this->source = $sourceImagePath;
    }
 
    public function createThumb($destImagePath, $thumbWidth=100) {
        $sourceImage = imagecreatefromjpeg($this->source);
        $orgWidth = imagesx($sourceImage);
        $orgHeight = imagesy($sourceImage);
        $thumbHeight = $thumbWidth; //floor($orgHeight * ($thumbWidth / $orgWidth));
        $destImage = imagecreatetruecolor($thumbWidth, $thumbHeight);
        imagecopyresampled($destImage, $sourceImage, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $orgWidth, $orgHeight);
        imagejpeg($destImage, $destImagePath);
        imagedestroy($sourceImage);
        imagedestroy($destImage);
    }
}

?>