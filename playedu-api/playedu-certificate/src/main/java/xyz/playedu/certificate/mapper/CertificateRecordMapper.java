package xyz.playedu.certificate.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import xyz.playedu.certificate.domain.CertificateRecord;

@Mapper
public interface CertificateRecordMapper extends BaseMapper<CertificateRecord> {

    @Select("SELECT * FROM certificate_records WHERE cert_no = #{certNo} AND status = 1")
    CertificateRecord findByCertNo(String certNo);
}
